// Shared intent/variant class maps for buttons and labels (HeroUI-like:
// solid, bordered, soft/flat and ghost variants in five intents).

export type Intencion = "neutral" | "accent" | "ok" | "warn" | "danger";
export type EstiloVariante = "solido" | "contorno" | "suave" | "texto";

export const CLASES_INTENCION: Record<Intencion, Record<EstiloVariante, string>> = {
  neutral: {
    solido: "bg-ink text-paper hover:bg-ink/85",
    contorno: "border-2 border-control bg-transparent text-ink hover:bg-control/60",
    suave: "bg-control text-ink hover:bg-[#e0e0e2]",
    texto: "bg-transparent text-ink hover:bg-control/70",
  },
  accent: {
    solido: "bg-accent text-white hover:bg-accent/90",
    contorno: "border-2 border-accent bg-transparent text-accent-ink hover:bg-accent-soft",
    suave: "bg-accent-soft text-accent-ink hover:bg-accent/15",
    texto: "bg-transparent text-accent-ink hover:bg-accent-soft",
  },
  ok: {
    solido: "bg-ok text-white hover:bg-ok/90",
    contorno: "border-2 border-ok bg-transparent text-ok-ink hover:bg-ok-soft",
    suave: "bg-ok-soft text-ok-ink hover:bg-ok/15",
    texto: "bg-transparent text-ok-ink hover:bg-ok-soft",
  },
  // The base warn color is light: solid warn uses ink text for contrast.
  warn: {
    solido: "bg-warn text-ink hover:bg-warn/85",
    contorno: "border-2 border-warn bg-transparent text-warn-ink hover:bg-warn-soft",
    suave: "bg-warn-soft text-warn-ink hover:bg-warn/30",
    texto: "bg-transparent text-warn-ink hover:bg-warn-soft",
  },
  danger: {
    solido: "bg-danger text-white hover:bg-danger/90",
    contorno: "border-2 border-danger bg-transparent text-danger-ink hover:bg-danger-soft",
    suave: "bg-danger-soft text-danger-ink hover:bg-danger/15",
    texto: "bg-transparent text-danger-ink hover:bg-danger-soft",
  },
};
