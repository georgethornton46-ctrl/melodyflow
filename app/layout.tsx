import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/utils";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "MelodyFlow — Hum it. Get the sheet music.", template: "%s · MelodyFlow" },
  description:
    "Sing, hum or play a melody into your phone. MelodyFlow writes the notes, the guitar tab and the chords in seconds.",
  applicationName: "MelodyFlow",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "MelodyFlow", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/icons/180" },
  openGraph: { type: "website", siteName: "MelodyFlow" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#060606",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
