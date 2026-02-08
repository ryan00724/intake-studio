import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/src/lib/supabase/auth-utils";

/**
 * GET /api/link-preview?url=...
 *
 * Returns OG metadata + an optional page screenshot via ScreenshotOne.
 *
 * Env vars:
 *   SCREENSHOT_API_KEY  – ScreenshotOne access key (required for screenshots)
 *
 * If the key is missing, screenshot is null and OG data is still returned.
 * Docs: https://screenshotone.com/docs/getting-started/
 */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http and https URLs are supported" }, { status: 400 });
  }

  // --- 1. Fetch OG metadata ---
  let title: string | undefined;
  let description: string | undefined;
  let image: string | undefined;
  const domain = parsed.hostname.replace(/^www\./, "");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IntakeStudio/1.0; +https://intakestudio.app)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const html = await res.text();

      const getMetaContent = (property: string): string | undefined => {
        const patterns = [
          new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
        ];
        for (const pat of patterns) {
          const match = html.match(pat);
          if (match?.[1]) return match[1].trim();
        }
        return undefined;
      };

      const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

      title =
        getMetaContent("og:title") ||
        getMetaContent("twitter:title") ||
        titleTagMatch?.[1]?.trim() ||
        undefined;

      description =
        getMetaContent("og:description") ||
        getMetaContent("twitter:description") ||
        getMetaContent("description") ||
        undefined;

      image =
        getMetaContent("og:image") ||
        getMetaContent("twitter:image") ||
        undefined;

      if (image) {
        try {
          image = new URL(image, url).href;
        } catch { /* leave as-is */ }
      }
    }
  } catch {
    // OG fetch failed — continue, we still attempt screenshot
  }

  // --- 2. Build ScreenshotOne screenshot URL ---
  // ScreenshotOne serves the image directly from the GET URL, so we don't
  // need to fetch it server-side. We just construct the URL and pass it to
  // the client as an <img src>.
  let screenshot: string | null = null;

  const accessKey = process.env.SCREENSHOT_API_KEY;

  if (accessKey) {
    try {
      const params = new URLSearchParams({
        access_key: accessKey,
        url: url,
        viewport_width: "1280",
        viewport_height: "800",
        format: "webp",
        image_quality: "80",
        full_page: "false",
        block_ads: "true",
        block_cookie_banners: "true",
        block_trackers: "true",
        cache: "true",
        cache_ttl: "86400",
      });

      screenshot = `https://api.screenshotone.com/take?${params.toString()}`;
    } catch {
      // Construction failed — leave null
    }
  }

  return NextResponse.json({
    url,
    title: title?.substring(0, 200),
    description: description?.substring(0, 500),
    image,
    screenshot,
    domain,
  });
}
