// Initials avatar with a soft gradient picked deterministically from the name.

const DEGRADADOS = [
  "from-sky-300 to-blue-500",
  "from-emerald-300 to-teal-500",
  "from-violet-300 to-purple-500",
  "from-amber-200 to-orange-400",
  "from-rose-300 to-pink-500",
  "from-cyan-300 to-sky-500",
];

function indicePorNombre(nombre: string): number {
  let suma = 0;
  for (const caracter of nombre) suma = (suma * 31 + caracter.charCodeAt(0)) % 9973;
  return suma % DEGRADADOS.length;
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const TAMANOS = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
};

export default function Avatar({
  nombre,
  tamano = "md",
  className = "",
}: {
  nombre: string;
  tamano?: keyof typeof TAMANOS;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-linear-to-br font-semibold text-white ring-2 ring-paper ${DEGRADADOS[indicePorNombre(nombre)]} ${TAMANOS[tamano]} ${className}`}
    >
      {iniciales(nombre)}
    </span>
  );
}
