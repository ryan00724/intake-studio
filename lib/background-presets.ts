// ── Gradient Presets ────────────────────────────────────────────────

export const GRADIENT_PRESETS: Record<string, { label: string; css: string }> = {
  sunset: {
    label: "Sunset",
    css: "linear-gradient(135deg, #ff6b35 0%, #f7c948 50%, #e8556d 100%)",
  },
  ocean: {
    label: "Ocean",
    css: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  aurora: {
    label: "Aurora",
    css: "linear-gradient(135deg, #43e97b 0%, #38f9d7 50%, #667eea 100%)",
  },
  midnight: {
    label: "Midnight",
    css: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  },
  forest: {
    label: "Forest",
    css: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
  },
  lavender: {
    label: "Lavender",
    css: "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)",
  },
  ember: {
    label: "Ember",
    css: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
  },
  arctic: {
    label: "Arctic",
    css: "linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)",
  },
  rose: {
    label: "Rose",
    css: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
  slate: {
    label: "Slate",
    css: "linear-gradient(135deg, #3a3d40 0%, #181719 100%)",
  },
};

// ── Pattern Presets ─────────────────────────────────────────────────

function svgDataUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function getPatternCss(
  type: string,
  fg: string = "#00000015",
  bg: string = "#ffffff"
): { backgroundColor: string; backgroundImage: string; backgroundSize?: string } {
  switch (type) {
    case "dots":
      return {
        backgroundColor: bg,
        backgroundImage: svgDataUrl(
          `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="1.5" fill="${fg}"/></svg>`
        ),
        backgroundSize: "20px 20px",
      };
    case "lines":
      return {
        backgroundColor: bg,
        backgroundImage: svgDataUrl(
          `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="40" x2="40" y2="0" stroke="${fg}" stroke-width="1"/></svg>`
        ),
        backgroundSize: "40px 40px",
      };
    case "grid":
      return {
        backgroundColor: bg,
        backgroundImage: svgDataUrl(
          `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="${fg}" stroke-width="1"/></svg>`
        ),
        backgroundSize: "40px 40px",
      };
    case "waves":
      return {
        backgroundColor: bg,
        backgroundImage: svgDataUrl(
          `<svg width="80" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M0 10 Q 20 0, 40 10 T 80 10" fill="none" stroke="${fg}" stroke-width="1.5"/></svg>`
        ),
        backgroundSize: "80px 20px",
      };
    case "diagonal":
      return {
        backgroundColor: bg,
        backgroundImage: svgDataUrl(
          `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M0 10 L10 0" stroke="${fg}" stroke-width="1"/></svg>`
        ),
        backgroundSize: "10px 10px",
      };
    default:
      return { backgroundColor: bg, backgroundImage: "none" };
  }
}

export const PATTERN_TYPES = [
  { id: "dots", label: "Dots" },
  { id: "lines", label: "Lines" },
  { id: "grid", label: "Grid" },
  { id: "waves", label: "Waves" },
  { id: "diagonal", label: "Diagonal" },
] as const;
