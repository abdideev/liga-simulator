// Injectable ID generation. Business logic receives a CrearId instead of
// calling Date.now()/Math.random() directly, so it can run reproducibly.

export type CrearId = (prefijo: string) => string;

/** Default generator for the running app: unique across reloads. */
export const crearIdAleatorio: CrearId = (prefijo) =>
  `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Deterministic generator: prefijo-1, prefijo-2, … with one counter per prefix. */
export function crearGeneradorSecuencial(): CrearId {
  const contadores: Record<string, number> = {};
  return (prefijo) => {
    contadores[prefijo] = (contadores[prefijo] ?? 0) + 1;
    return `${prefijo}-${contadores[prefijo]}`;
  };
}
