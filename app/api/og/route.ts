import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IntakeStudio/1.0; +https://intakestudio.app)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Could not retrieve the page" }, { status: 500 });
    }

    const html = await res.text();

    // --- Parsing helpers ---

    const getMetaContent = (property: string): string | undefined => {
      // Handles both attribute orderings:
      //   <meta property="og:title" content="...">
      //   <meta content="..." property="og:title">
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

    const title =
      getMetaContent("og:title") ||
      getMetaContent("twitter:title") ||
      titleTagMatch?.[1]?.trim() ||
      undefined;

    const description =
      getMetaContent("og:description") ||
      getMetaContent("twitter:description") ||
      getMetaContent("description") ||
      undefined;

    // Resolve og:image to absolute URL when possible
    let image =
      getMetaContent("og:image") ||
      getMetaContent("twitter:image") ||
      undefined;

    if (image) {
      try {
        // Handles relative paths like "/img/og.png" or "//cdn.example.com/img.jpg"
        image = new URL(image, url).href;
      } catch {
        // Leave as-is if resolution fails
      }
    }

    const domain = parsed.hostname.replace(/^www\./, "");

    return NextResponse.json({
      url,
      title: title?.substring(0, 200),
      description: description?.substring(0, 500),
      image,
      domain,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 500 });
  }
}
