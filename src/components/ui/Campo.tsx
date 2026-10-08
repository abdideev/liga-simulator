import type { ReactNode } from "react";

export default function Campo({
  etiqueta,
  ayuda,
  error,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="text-xs text-muted">{ayuda}</span>}
      {error && <span className="text-xs font-medium text-danger-ink">{error}</span>}
    </label>
  );
}

export const claseCampo =
  "min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:bg-paper focus:ring-2 focus:ring-accent-soft";
