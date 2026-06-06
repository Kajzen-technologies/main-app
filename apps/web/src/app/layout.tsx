import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider, themeInitScript } from "../lib/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "Prague Now",
  description: "Emergency portal and interactive map for Prague residents during a blackout.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RescueMesh"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#111214" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
