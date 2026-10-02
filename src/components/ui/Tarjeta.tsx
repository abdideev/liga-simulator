import type { HTMLAttributes } from "react";

export default function Tarjeta({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm ${className}`}
    />
  );
}
