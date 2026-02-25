import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { T } from "@/lib/theme";
import "./globals.css";

// 1. Initialize the font at build time
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PerDiem.fyi — Know Your Rate Before You Sign",
  description:
    "Travel nurse per diem calculator. Plug in your assignment ZIP and see what GSA says your stipend should be. The math your recruiter won't show you.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://perdiem.fyi",
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
    // 2. Apply the font class to the HTML tag
    <html lang="en" className={inter.className}>
      {/* 3. Apply base theme tokens to the body */}
      <body
        style={{
          backgroundColor: T.bg,
          color: T.text,
          margin: 0,
          minHeight: "100vh",
          // Premium typography tweaks to make Inter look razor-sharp on Mac/iOS
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {children}
      </body>
    </html>
  );
}
