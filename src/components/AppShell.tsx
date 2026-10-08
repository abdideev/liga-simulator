"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import Cargando from "./ui/Cargando";

const InnerApp = dynamic(() => import("./InnerApp"), {
  ssr: false,
  loading: () => <Cargando />,
});

export default function AppShell({ children }: { children: ReactNode }) {
  return <InnerApp>{children}</InnerApp>;
}
