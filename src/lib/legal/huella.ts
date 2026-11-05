"use client";

import { useEffect, useState } from "react";

/** SHA-256 of a UTF-8 string as 64 lowercase hex characters (Web Crypto). */
export async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(resumen))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** "9f2c4e…b71a": short form for screens; the full value is kept in the record. */
export function huellaCorta(huella: string): string {
  return huella ? `${huella.slice(0, 6)}…${huella.slice(-4)}` : "calculando…";
}

/** Hook: hash of a text, recomputed when the text changes ("" while computing). */
export function useHuella(texto: string): string {
  const [resultado, setResultado] = useState<{ texto: string; huella: string }>({ texto: "", huella: "" });
  useEffect(() => {
    let vigente = true;
    sha256Hex(texto).then((huella) => {
      if (vigente) setResultado({ texto, huella });
    });
    return () => {
      vigente = false;
    };
  }, [texto]);
  return resultado.texto === texto ? resultado.huella : "";
}

/** Short description of the browser and OS, stored as the "dispositivo" of an acceptance. */
export function describirDispositivo(): string {
  if (typeof navigator === "undefined") return "Desconocido";
  const ua = navigator.userAgent;
  const navegador = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Navegador";
  const sistema = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "otro sistema";
  return `${navegador} · ${sistema}`;
}
