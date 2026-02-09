import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Intake Studio – Beautiful client intake forms that convert";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          padding: "60px 80px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ffffff, #a1a1aa)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
              color: "#09090b",
            }}
          >
            I
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "#fafafa",
            }}
          >
            Intake Studio
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#fafafa",
              lineHeight: 1.15,
              margin: 0,
              maxWidth: "900px",
            }}
          >
            Beautiful client intake forms that convert
          </h1>
          <p
            style={{
              fontSize: "22px",
              color: "#a1a1aa",
              margin: 0,
              maxWidth: "700px",
              lineHeight: 1.5,
            }}
          >
            Create guided, multi-step intake experiences your clients will
            actually enjoy filling out.
          </p>
        </div>

        {/* Pill */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "999px",
            backgroundColor: "#27272a",
            fontSize: "16px",
            color: "#a1a1aa",
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
          intakestudio.app — now in beta
        </div>
      </div>
    ),
    { ...size }
  );
}
