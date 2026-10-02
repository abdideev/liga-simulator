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
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-gray-800">{etiqueta}</span>
      {children}
      {ayuda && !error && <span className="text-xs text-gray-500">{ayuda}</span>}
      {error && <span className="text-xs font-medium text-(--color-danger)">{error}</span>}
    </label>
  );
}

export const claseCampo =
  "min-h-11 w-full rounded-lg border border-(--color-border) bg-white px-3 text-base text-gray-900 outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary-light)";
