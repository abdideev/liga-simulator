import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import AppShell from "@/components/AppShell";

// next/font self-hosts Inter, so the mesa de control works without internet.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Liga Simulator — Prototipo",
  description:
    "Prototipo navegable para validar el flujo de una jornada completa de una liga de fútbol amateur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
