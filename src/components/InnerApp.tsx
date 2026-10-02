"use client";

import { useState, type ReactNode } from "react";

import { SimuladorProvider } from "@/context/SimuladorContext";

import Header from "./Header";
import NavSidebar from "./NavSidebar";

export default function InnerApp({ children }: { children: ReactNode }) {
  const [navAbierto, setNavAbierto] = useState(false);

  return (
    <SimuladorProvider>
      <Header onAbrirMenu={() => setNavAbierto(true)} />
      <div className="md:flex">
        <NavSidebar abierto={navAbierto} onCerrar={() => setNavAbierto(false)} />
        <main className="min-w-0 flex-1 px-3 py-4 md:px-6 md:py-6">{children}</main>
      </div>
    </SimuladorProvider>
  );
}
