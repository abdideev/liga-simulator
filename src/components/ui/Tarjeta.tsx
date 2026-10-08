import type { HTMLAttributes } from "react";

export default function Tarjeta({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-border bg-paper p-4 shadow-sm sm:p-5 ${className}`}
    />
  );
}
