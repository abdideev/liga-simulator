"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { AccionSimulador } from "@/lib/acciones";
import { crearIdAleatorio, type CrearId } from "@/lib/ids";
import { simuladorReducer } from "@/lib/reducer";
import { crearEstadoInicial } from "@/lib/seed";
import { cargarEstado, guardarEstado, limpiarEstado } from "@/lib/storage";
import type { ResultadoOperacion, SimuladorState } from "@/lib/types";
import { validarAccion } from "@/lib/validaciones";

interface SimuladorContextValue {
  estado: SimuladorState;
  /**
   * Validates the action against the current state and, if valid, applies it
   * through simuladorReducer. The result is computed BEFORE setEstado, so it
   * is reliable even though React may run the state updater later.
   */
  despachar: (accion: AccionSimulador) => ResultadoOperacion;
  reiniciarSimulacion: () => void;
}

const SimuladorContext = createContext<SimuladorContextValue | null>(null);

const relojDelSistema = () => new Date();

export function SimuladorProvider({
  children,
  crearId = crearIdAleatorio,
  reloj = relojDelSistema,
}: {
  children: ReactNode;
  /** Injectable for reproducible runs; defaults to unique random IDs. */
  crearId?: CrearId;
  /** Injectable "now"; defaults to the system clock. */
  reloj?: () => Date;
}) {
  // Lazy init reads any previously saved state synchronously. This provider
  // is meant to be mounted client-only (see AppShell, dynamic ssr:false)
  // so there is no hydration mismatch from reading localStorage here.
  const [estado, setEstado] = useState<SimuladorState>(
    () => cargarEstado() ?? crearEstadoInicial(reloj())
  );

  useEffect(() => {
    guardarEstado(estado);
  }, [estado]);

  const despachar = useCallback(
    (accion: AccionSimulador): ResultadoOperacion => {
      const entorno = { crearId, ahora: reloj() };
      const resultado = validarAccion(estado, accion, entorno);
      if (resultado.ok) {
        setEstado((prev) => simuladorReducer(prev, accion, entorno));
      }
      return resultado;
    },
    [estado, crearId, reloj]
  );

  const reiniciarSimulacion = useCallback(() => {
    limpiarEstado();
    setEstado(crearEstadoInicial(reloj()));
  }, [reloj]);

  const value: SimuladorContextValue = { estado, despachar, reiniciarSimulacion };

  return <SimuladorContext.Provider value={value}>{children}</SimuladorContext.Provider>;
}

export function useSimulador(): SimuladorContextValue {
  const ctx = useContext(SimuladorContext);
  if (!ctx) throw new Error("useSimulador debe usarse dentro de SimuladorProvider");
  return ctx;
}
