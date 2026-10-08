"use client";

import { useState } from "react";
import { CheckCircle2, Gavel, Lock, MessageSquareWarning } from "lucide-react";

import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import { claseCampo } from "@/components/ui/Campo";
import Etiqueta from "@/components/ui/Etiqueta";
import type { Lado, Protesta, ResultadoOperacion } from "@/lib/types";

export interface FirmaLado {
  lado: Lado;
  nombreEquipo: string;
  confirmado: boolean;
  protesta?: Protesta;
  /** Whether the current role may sign for this side. */
  puedeFirmar: boolean;
}

function BloqueFirma({
  firma,
  actaCerrada,
  enCurso,
  puedeResolver,
  onConfirmar,
  onProtestar,
  onRetirarProtesta,
  onResolver,
}: {
  firma: FirmaLado;
  actaCerrada: boolean;
  enCurso: boolean;
  puedeResolver: boolean;
  onConfirmar: (confirmado: boolean) => ResultadoOperacion;
  onProtestar: (motivo: string) => ResultadoOperacion;
  onRetirarProtesta: () => ResultadoOperacion;
  onResolver: (texto: string) => ResultadoOperacion;
}) {
  const [redactando, setRedactando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [resolucion, setResolucion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editable = firma.puedeFirmar && !actaCerrada && enCurso;

  function reportar(resultado: ResultadoOperacion): boolean {
    setError(resultado.ok ? null : (resultado.motivo ?? "No se pudo completar la acción"));
    return resultado.ok;
  }

  return (
    <div
      className="space-y-3 rounded-2xl bg-canvas p-4"
      data-testid={`firma-${firma.lado}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Delegado de {firma.nombreEquipo}</p>
        {firma.protesta ? (
          <Etiqueta intencion="danger" icono={MessageSquareWarning}>
            Protestó
          </Etiqueta>
        ) : firma.confirmado ? (
          <Etiqueta intencion="ok" icono={CheckCircle2}>
            Confirmó
          </Etiqueta>
        ) : (
          <Etiqueta intencion="warn">Pendiente</Etiqueta>
        )}
      </div>

      {!firma.protesta && !actaCerrada && (
        <label className="flex min-h-11 items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={firma.confirmado}
            disabled={!editable}
            onChange={(e) => reportar(onConfirmar(e.target.checked))}
            data-testid={`confirmacion-${firma.lado}`}
          />
          Confirmo el resultado y los eventos capturados
        </label>
      )}

      {firma.protesta && (
        <div className="space-y-1 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger-ink">
          <p>
            <span className="font-semibold">Motivo:</span> {firma.protesta.motivo}
          </p>
          {firma.protesta.resolucion && (
            <p className="text-ink">
              <span className="font-semibold">Resolución:</span> {firma.protesta.resolucion.texto}
            </p>
          )}
        </div>
      )}

      {editable && !firma.protesta && !firma.confirmado && !redactando && (
        <Boton
          intencion="danger"
          variante="texto"
          className="px-2"
          onClick={() => setRedactando(true)}
          data-testid={`boton-protestar-${firma.lado}`}
        >
          <MessageSquareWarning size={16} />
          Firmar con protesta
        </Boton>
      )}

      {editable && redactando && !firma.protesta && (
        <div className="space-y-2">
          <textarea
            className={`${claseCampo} min-h-20 py-2`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe el motivo de la protesta (ej. gol en fuera de lugar no marcado, jugador no registrado en cancha)"
            data-testid={`motivo-protesta-${firma.lado}`}
          />
          <div className="flex gap-2">
            <Boton
              intencion="danger"
              onClick={() => {
                if (reportar(onProtestar(motivo))) {
                  setRedactando(false);
                  setMotivo("");
                }
              }}
              data-testid={`boton-registrar-protesta-${firma.lado}`}
            >
              Registrar protesta
            </Boton>
            <Boton intencion="neutral" variante="contorno" onClick={() => setRedactando(false)}>
              Cancelar
            </Boton>
          </div>
        </div>
      )}

      {editable && firma.protesta && (
        <Boton
          intencion="neutral"
          variante="contorno"
          onClick={() => reportar(onRetirarProtesta())}
          data-testid={`boton-retirar-protesta-${firma.lado}`}
        >
          Retirar protesta
        </Boton>
      )}

      {actaCerrada && firma.protesta && !firma.protesta.resolucion && puedeResolver && (
        <div className="space-y-2 border-t border-control pt-3">
          <input
            className={claseCampo}
            value={resolucion}
            onChange={(e) => setResolucion(e.target.value)}
            placeholder="Resolución del administrador o comisión disciplinaria"
            data-testid={`campo-resolucion-${firma.lado}`}
          />
          <Boton
            variante="suave"
            onClick={() => reportar(onResolver(resolucion))}
            data-testid={`boton-resolver-protesta-${firma.lado}`}
          >
            <Gavel size={16} />
            Registrar resolución
          </Boton>
        </div>
      )}

      {error && <Aviso intencion="danger">{error}</Aviso>}
    </div>
  );
}

export default function PanelCierreActa({
  local,
  visitante,
  actaCerrada,
  enCurso,
  pendientesOffline,
  puedeCerrar,
  puedeResolver,
  onConfirmar,
  onProtestar,
  onRetirarProtesta,
  onResolver,
  onCerrarActa,
}: {
  local: FirmaLado;
  visitante: FirmaLado;
  actaCerrada: boolean;
  enCurso: boolean;
  pendientesOffline: number;
  puedeCerrar: boolean;
  puedeResolver: boolean;
  onConfirmar: (lado: Lado, confirmado: boolean) => ResultadoOperacion;
  onProtestar: (lado: Lado, motivo: string) => ResultadoOperacion;
  onRetirarProtesta: (lado: Lado) => ResultadoOperacion;
  onResolver: (lado: Lado, texto: string) => ResultadoOperacion;
  onCerrarActa: () => void;
}) {
  const firmados =
    (local.confirmado || !!local.protesta) && (visitante.confirmado || !!visitante.protesta);
  const conProtesta = !!local.protesta || !!visitante.protesta;

  return (
    <div className="space-y-3">
      {actaCerrada ? (
        <Aviso intencion={conProtesta ? "warn" : "ok"} data-testid="acta-cerrada">
          {conProtesta
            ? "Acta cerrada con protesta. El resultado cuenta en la tabla mientras la protesta se resuelve."
            : "Acta cerrada. El partido quedó finalizado y contabilizado en la tabla de posiciones."}
        </Aviso>
      ) : !enCurso ? (
        <Aviso intencion="accent">
          El acta se firma y se cierra una vez iniciado el partido. Un partido que no se jugó no
          puede cerrarse ni contar en la tabla.
        </Aviso>
      ) : (
        <p className="text-sm text-muted">
          Cada delegado confirma el acta o la firma con protesta. Si se agregan o eliminan eventos,
          las confirmaciones se reinician para que vuelvan a revisarla.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[local, visitante].map((firma) => (
          <BloqueFirma
            key={firma.lado}
            firma={firma}
            actaCerrada={actaCerrada}
            enCurso={enCurso}
            puedeResolver={puedeResolver}
            onConfirmar={(confirmado) => onConfirmar(firma.lado, confirmado)}
            onProtestar={(motivo) => onProtestar(firma.lado, motivo)}
            onRetirarProtesta={() => onRetirarProtesta(firma.lado)}
            onResolver={(texto) => onResolver(firma.lado, texto)}
          />
        ))}
      </div>

      {!actaCerrada && enCurso && (
        <>
          {pendientesOffline > 0 && (
            <Aviso intencion="warn">
              Hay {pendientesOffline} evento(s) sin sincronizar. Desactiva el modo sin conexión
              antes de cerrar el acta.
            </Aviso>
          )}
          {puedeCerrar && (
            <Boton
              intencion="danger"
              disabled={!firmados || pendientesOffline > 0}
              onClick={onCerrarActa}
              data-testid="boton-cerrar-acta"
            >
              <Lock size={16} />
              Cerrar acta
            </Boton>
          )}
        </>
      )}
    </div>
  );
}
