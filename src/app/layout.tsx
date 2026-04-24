import type { Metadata, Viewport } from "next";
import { Dancing_Script } from "next/font/google";
import "./globals.css";

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "adipwoli ludo",
  description: "Minimalist aesthetic 2-player Ludo game",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "adipwoli ludo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dancingScript.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white dot-matrix">
        {children}
      </body>
    </html>
  );
}
