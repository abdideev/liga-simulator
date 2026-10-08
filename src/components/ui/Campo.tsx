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

/** White input with a soft shadow and hairline ring; accent ring on focus. */
export const claseCampo =
  "min-h-11 w-full rounded-xl bg-paper px-3.5 text-base text-ink shadow-control outline-none ring-1 ring-ink/5 transition-[box-shadow] duration-150 placeholder:text-muted/70 hover:ring-ink/15 focus:ring-2 focus:ring-accent";
