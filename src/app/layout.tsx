import type { Metadata } from "next";
import "./globals.css";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap";

export const metadata: Metadata = {
  title: "PerDiem.fyi — Know Your Rate Before You Sign",
  description:
    "Travel nurse per diem calculator. Plug in your assignment ZIP and see what GSA says your stipend should be. The math your recruiter won't show you.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://perdiem.fyi"
  ),
  openGraph: {
    title: "PerDiem.fyi — Your Per Diem, Decoded",
    description:
      "Check your travel nurse pay package against GSA per diem rates. See what you actually keep after taxes.",
    siteName: "PerDiem.fyi",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PerDiem.fyi — Know Your Rate",
    description:
      "Travel nurse per diem calculator built by nurses. GSA rates, housing data, pay transparency.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link href={FONT_URL} rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
