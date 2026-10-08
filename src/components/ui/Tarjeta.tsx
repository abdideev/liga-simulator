import type { HTMLAttributes } from "react";

/** White surface with generous radius and a diffuse shadow instead of a border. */
export default function Tarjeta({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`rounded-3xl bg-paper p-5 shadow-suave sm:p-6 ${className}`} />
  );
}
