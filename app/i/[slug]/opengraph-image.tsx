import { generateIntakeOGImage } from "./og-shared";

export const runtime = "edge";
export const alt = "Intake Form";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateIntakeOGImage(slug);
}
