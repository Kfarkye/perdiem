// ━━━ PERDIEM.FYI DESIGN TOKENS ━━━
// Canonical theme object. Do NOT use Tailwind for product pages.
// Inline styles reference this object directly.

import type { ThemeTokens } from "@/types";

export const T: ThemeTokens = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  surfaceRaised: "#F5F4F0",
  surfaceInset: "#EEEEE8",
  border: "#E0DDD6",
  borderSubtle: "#ECEAE4",
  borderFocus: "#1A8A6E",
  text: "#1A1A18",
  textSecondary: "#6B6860",
  textTertiary: "#9E9A92",
  primary: "#1A8A6E",
  primaryHover: "#157A60",
  primaryMuted: "#E8F5F0",
  primaryBorder: "#B8DDD0",
  moneyPositive: "#16A34A",
  moneyPositiveBg: "#F0FDF4",
  moneyNegative: "#DC2626",
  moneyNegativeBg: "#FEF2F2",
  accent: "#B8860B",
  accentMuted: "#FEF9E7",
  accentBorder: "#F0E0A0",
  info: "#2563EB",
  infoBg: "#EFF6FF",
} as const;

export const FONTS = {
  sans: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const FONT_URL =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
