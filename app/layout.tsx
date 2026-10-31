import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// next/font downloads Inter at build time and serves it from our own domain (no Google request from phones).
const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ICPC Checkpoint",
  description: "Schedule and info for ICPC contest day.",
  manifest: "/manifest", // volunteer pages replace this with their own manifest
  icons: { icon: "/icons/192", apple: "/icons/180" },
  appleWebApp: { capable: true, title: "ICPC Checkpoint", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0E1420",
  viewportFit: "cover", // lets the dark background run under the iPhone notch; globals.css pads the content back in
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
