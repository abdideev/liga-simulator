import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import AppShell from "@/components/AppShell";

// Closest Google Fonts match to Satoshi (geometric grotesk). next/font
// self-hosts it, so the mesa de control works without internet.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Liga Simulator — Prototipo",
  description:
    "Prototipo navegable para validar el flujo de una jornada completa de una liga de fútbol amateur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
