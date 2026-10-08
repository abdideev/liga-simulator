// Local-time date helpers. ISO dates (YYYY-MM-DD) in this app are calendar
// dates in the league's local time zone, never UTC instants.

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Formats a Date as YYYY-MM-DD using local time (not toISOString, which is UTC). */
export function fechaISOLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

/** Parses YYYY-MM-DD as local midnight. */
export function parsearFechaLocal(fechaISO: string): Date {
  return new Date(`${fechaISO}T00:00:00`);
}

export function sumarDiasISO(fechaISO: string, dias: number): string {
  const fecha = parsearFechaLocal(fechaISO);
  fecha.setDate(fecha.getDate() + dias);
  return fechaISOLocal(fecha);
}

/** Today's local date as YYYY-MM-DD. */
export function fechaHoy(referencia: Date = new Date()): string {
  return fechaISOLocal(referencia);
}
