// ━━━ PERDIEM.FYI DESIGN TOKENS ━━━
// Canonical theme object. Do NOT use Tailwind for product pages.
// Inline styles reference this object directly.

import type { ThemeTokens } from "@/types";

export const T: ThemeTokens = {
  bg: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceRaised: "#F3F4F6",
  surfaceInset: "#E5E7EB",
  border: "#E5E7EB",
  borderSubtle: "#F3F4F6",
  borderFocus: "#1A8A6E",
  text: "#111827",
  textSecondary: "#4B5563",
  textTertiary: "#6B7280",
  primary: "#1A8A6E",
  primaryHover: "#157A60",
  primaryMuted: "#E8F5F0",
  primaryBorder: "#B8DDD0",
  moneyPositive: "#16A34A",
  moneyPositiveBg: "#F0FDF4",
  moneyNegative: "#EF4444",
  moneyNegativeBg: "#FEF2F2",
  accent: "#B45309",
  accentMuted: "#FEF3C7",
  accentBorder: "#FDE68A",
  info: "#2563EB",
  infoBg: "#EFF6FF",
} as const;

export const FONTS = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const;

export const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
