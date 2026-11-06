
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { APP_NAME } from "@/lib/manifest";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Schedule and info for ICPC contest day.",
  manifest: "/manifest",
  icons: { icon: "/icons/192", apple: "/icons/180" },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E1420",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
