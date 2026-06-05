import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Praha Odolná - Blackout Resilience App",
  description: "Nouzový portál a interaktivní mapa pro obyvatele Prahy během výpadku proudu.",
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
