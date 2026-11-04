// Injectable ID generation. Business logic receives a CrearId instead of
// calling Date.now()/Math.random() directly, so it can run reproducibly.

export type CrearId = (prefijo: string) => string;

/**
 * Default generator for the running app: unique across reloads. Uses the
 * Web Crypto RNG (available on plain-HTTP LAN origins too, unlike randomUUID).
 */
export const crearIdAleatorio: CrearId = (prefijo) => {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const sufijo = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefijo}-${Date.now()}-${sufijo}`;
};

/** Deterministic generator: prefijo-1, prefijo-2, … with one counter per prefix. */
export function crearGeneradorSecuencial(): CrearId {
  const contadores: Record<string, number> = {};
  return (prefijo) => {
    contadores[prefijo] = (contadores[prefijo] ?? 0) + 1;
    return `${prefijo}-${contadores[prefijo]}`;
  };
}
