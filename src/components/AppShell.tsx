"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const InnerApp = dynamic(() => import("./InnerApp"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center text-muted">
      Cargando simulador…
    </div>
  ),
});

export default function AppShell({ children }: { children: ReactNode }) {
  return <InnerApp>{children}</InnerApp>;
}
