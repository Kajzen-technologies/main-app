import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Praha Odolná - Administrace",
  description: "Administrační panel pro blackout resilience aplikaci hl. m. Prahy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
