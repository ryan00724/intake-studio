import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/src/lib/supabase/server";

const PUBLIC_MARKER = "/storage/v1/object/public/";

function parsePublicPath(url: string) {
  const idx = url.indexOf(PUBLIC_MARKER);
  if (idx === -1) return null;
  const rest = url.slice(idx + PUBLIC_MARKER.length);
  const [bucket, ...pathParts] = rest.split("/");
  if (!bucket || pathParts.length === 0) return null;
  return { bucket, path: pathParts.join("/") };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const parsed = parsePublicPath(url);
  if (!parsed) {
    return NextResponse.json({ url });
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, 60 * 60);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ url, error: error?.message || "Signed URL failed" }, { status: 200 });
    }

    return NextResponse.json({ url, signedUrl: data.signedUrl });
  } catch (err) {
    return NextResponse.json({ url, error: "Signed URL failed" }, { status: 200 });
  }
}
