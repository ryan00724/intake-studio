import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/src/lib/supabase/server";

const OG_SIZE = { width: 1200, height: 630 };

const GRADIENT_PRESETS: Record<string, string> = {
  sunset: "linear-gradient(135deg, #ff6b35 0%, #f7c948 50%, #e8556d 100%)",
  ocean: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  aurora: "linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #667eea 100%)",
  midnight: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  forest: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
  lavender: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
  ember: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
  arctic: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
  rose: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  slate: "linear-gradient(135deg, #3a3d40 0%, #181719 100%)",
};

function isLightBackground(bg: any): boolean {
  if (!bg) return false;
  if (bg.type === "color" && bg.color) {
    const hex = bg.color.replace("#", "");
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 160;
    }
  }
  if (bg.type === "gradient" && bg.gradientPreset) {
    return ["arctic", "rose"].includes(bg.gradientPreset);
  }
  if (bg.type === "pattern" && bg.patternBgColor) {
    const hex = bg.patternBgColor.replace("#", "");
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r * 299 + g * 587 + b * 114) / 1000 > 160;
    }
  }
  return false;
}

export async function generateIntakeOGImage(slug: string) {
  let title = "Intake Form";
  let description = "";
  let sectionCount = 0;
  let background: any = null;
  let cardStyle: "light" | "dark" = "light";

  try {
    const { data } = await supabaseAdmin
      .from("intakes")
      .select("title, published_json")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (data) {
      const meta = data.published_json?.metadata;
      title = meta?.title || data.title || "Intake Form";
      description =
        meta?.description || `Complete the "${data.title}" intake form.`;
      sectionCount = data.published_json?.sections?.length || 0;
      background = meta?.theme?.background;
      cardStyle = meta?.theme?.cardStyle || "light";
    }
  } catch {
    // Use defaults
  }

  if (description.length > 120) {
    description = description.substring(0, 117) + "...";
  }

  // Resolve background styles
  const bgStyles: Record<string, string> = {};
  let bgImageUrl: string | null = null;

  if (background?.type === "color" && background.color) {
    bgStyles.backgroundColor = background.color;
  } else if (background?.type === "gradient" && background.gradientPreset) {
    bgStyles.backgroundImage =
      GRADIENT_PRESETS[background.gradientPreset] || GRADIENT_PRESETS.ocean;
  } else if (background?.type === "animated_gradient" && background.animatedGradientColors?.length) {
    bgStyles.backgroundImage = `linear-gradient(135deg, ${background.animatedGradientColors.join(", ")})`;
  } else if (background?.type === "image" && background.imageUrl) {
    bgImageUrl = background.imageUrl;
    bgStyles.backgroundColor = "#09090b";
  } else if (background?.type === "video") {
    bgStyles.backgroundColor = background.overlayColor || "#09090b";
  } else if (background?.type === "pattern" && background.patternBgColor) {
    bgStyles.backgroundColor = background.patternBgColor;
  } else {
    bgStyles.backgroundColor = "#09090b";
  }

  const hasVisualBg = background?.type && background.type !== "none";
  const lightBg = isLightBackground(background);
  const textMuted = "#71717a";
  const textPrimary = lightBg ? "#18181b" : "#fafafa";
  const textSecondary = lightBg ? "#52525b" : "#a1a1aa";
  const pillBg = lightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)";
  const pillText = lightBg ? "#3f3f46" : "#a1a1aa";

  const isDarkCard = cardStyle === "dark";
  const cardBg = hasVisualBg
    ? isDarkCard ? "rgba(24, 24, 27, 0.85)" : "rgba(255, 255, 255, 0.85)"
    : "transparent";
  const cardTextPrimary = hasVisualBg
    ? isDarkCard ? "#fafafa" : "#18181b"
    : textPrimary;
  const cardTextSecondary = hasVisualBg
    ? isDarkCard ? "#a1a1aa" : "#52525b"
    : textSecondary;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          ...bgStyles,
        }}
      >
        {bgImageUrl && (
          <img
            src={bgImageUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {(bgImageUrl || background?.type === "video") && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: background?.overlayColor || "#000000",
              opacity: background?.overlayOpacity ?? 0.55,
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "60px 80px",
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: lightBg && !hasVisualBg
                  ? "linear-gradient(135deg, #18181b, #3f3f46)"
                  : "linear-gradient(135deg, #ffffff, #a1a1aa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 800,
                color: lightBg && !hasVisualBg ? "#fafafa" : "#09090b",
              }}
            >
              I
            </div>
            <span style={{ fontSize: "22px", fontWeight: 600, color: textMuted }}>
              Intake Studio
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: 1,
              justifyContent: "center",
              backgroundColor: cardBg,
              borderRadius: hasVisualBg ? "20px" : "0px",
              padding: hasVisualBg ? "40px" : "0px",
              marginTop: "20px",
              marginBottom: "20px",
              maxWidth: "900px",
            }}
          >
            <h1
              style={{
                fontSize: "52px",
                fontWeight: 800,
                color: cardTextPrimary,
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              {title}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: "24px",
                  color: cardTextSecondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {description}
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {sectionCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 20px",
                  borderRadius: "999px",
                  backgroundColor: pillBg,
                  fontSize: "16px",
                  color: pillText,
                }}
              >
                {sectionCount} {sectionCount === 1 ? "section" : "sections"}
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 20px",
                borderRadius: "999px",
                backgroundColor: pillBg,
                fontSize: "16px",
                color: pillText,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              Published
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
