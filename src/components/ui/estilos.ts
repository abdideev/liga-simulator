// Shared intent/variant class maps for buttons and labels.

export type Intencion = "neutral" | "accent" | "ok" | "warn" | "danger";
export type EstiloVariante = "solido" | "contorno" | "suave" | "texto";

export const CLASES_INTENCION: Record<Intencion, Record<EstiloVariante, string>> = {
  neutral: {
    solido: "bg-ink text-paper hover:bg-ink/85",
    contorno: "border border-border bg-transparent text-ink hover:bg-surface",
    suave: "bg-surface text-ink hover:bg-border/60",
    texto: "bg-transparent text-ink hover:bg-surface",
  },
  accent: {
    solido: "bg-accent text-white hover:bg-accent-ink",
    contorno: "border border-accent bg-transparent text-accent-ink hover:bg-accent-soft",
    suave: "bg-accent-soft text-accent-ink hover:bg-accent/15",
    texto: "bg-transparent text-accent-ink hover:bg-accent-soft",
  },
  ok: {
    solido: "bg-ok text-white hover:bg-ok-ink",
    contorno: "border border-ok bg-transparent text-ok-ink hover:bg-ok-soft",
    suave: "bg-ok-soft text-ok-ink hover:bg-ok/15",
    texto: "bg-transparent text-ok-ink hover:bg-ok-soft",
  },
  // The base warn color is light: solid warn uses ink text for contrast.
  warn: {
    solido: "bg-warn text-ink hover:bg-warn/80",
    contorno: "border border-warn bg-transparent text-warn-ink hover:bg-warn-soft",
    suave: "bg-warn-soft text-warn-ink hover:bg-warn/30",
    texto: "bg-transparent text-warn-ink hover:bg-warn-soft",
  },
  danger: {
    solido: "bg-danger text-white hover:bg-danger-ink",
    contorno: "border border-danger bg-transparent text-danger-ink hover:bg-danger-soft",
    suave: "bg-danger-soft text-danger-ink hover:bg-danger/15",
    texto: "bg-transparent text-danger-ink hover:bg-danger-soft",
  },
};
