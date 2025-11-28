export const colors = {
  // Blue Palette (light → dark)
  blue10: "#F6FAFF",
  blue20: "#E0EEFF",
  blue30: "#DDEEFF",
  blue40: "#B3D4FF",
  blue50: "#6DACFF",
  blue60: "#2684FF",
  blue70: "#0065FF",
  blue80: "#0058CC",
  blue90: "#004299",
  blue95: "#004299", // 중복 포함

  // Black Palette (light → dark)
  gray10: "#FFFFFF",
  gray20: "#F9FAFB",
  gray30: "#EFEFEF",
  gray40: "#C9C9C9",
  gray50: "#B4B4B4",
  gray60: "#9A9A9A",
  gray70: "#808080",
  gray80: "#636363",
  gray90: "#434343",
  gray95: "#2D2D2D",
  black: "#000000",
} as const;

export type ColorName = keyof typeof colors;
