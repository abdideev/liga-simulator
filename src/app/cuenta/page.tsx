"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Download,
  FileCheck,
  Inbox,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import Etiqueta from "@/components/ui/Etiqueta";
import Pestanas from "@/components/ui/Pestanas";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import Modal from "@/components/legal/Modal";
import VistaConstancia from "@/components/legal/VistaConstancia";
import { huellaCorta } from "@/lib/legal/huella";
import {
  ETIQUETA_ARCO,
  ETIQUETA_ESTADO_LICENCIA,
  ETIQUETA_MOTIVO_CANCELACION,
  diasHabilesEntre,
  finDeTemporada,
  resumenPlan,
  usuarioActual,
} from "@/lib/legal/reglas";
import { fechaHoy, parsearFechaLocal, sumarDiasISO } from "@/lib/fechas";
import type { ConstanciaAceptacion, MotivoCancelacion, TipoArco } from "@/lib/types";

type Pestana = "plan" | "privacidad" | "arco";

const pesos = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
const fechaLarga = (iso: string) =>
  parsearFechaLocal(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });

function pestanaInicial(esAdmin: boolean): Pestana {
  const tab = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("tab");
  if (tab === "arco" || tab === "privacidad") return tab;
  return esAdmin ? "plan" : "privacidad";
}

export default function CuentaPage() {
  const { estado } = useSimulador();
  const usuario = usuarioActual(estado)!;
  const esAdmin = usuario.rol === "administrador";
  const [pestana, setPestana] = useState<Pestana>(() => pestanaInicial(esAdmin));

  const opciones: { id: Pestana; etiqueta: string }[] = [
    ...(esAdmin ? [{ id: "plan" as const, etiqueta: "Plan y licencia" }] : []),
    { id: "privacidad", etiqueta: "Mis aceptaciones" },
    { id: "arco", etiqueta: "Derechos ARCO" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="pagina-cuenta">
      <EncabezadoPagina icono={ICONO_SECCION.cuenta} titulo="Mi cuenta" descripcion={`${usuario.nombre} · ${usuario.cargo}`} />
      <Pestanas opciones={opciones} valor={pestana} onCambiar={setPestana} />
      {pestana === "plan" && esAdmin && <PlanYLicencia />}
      {pestana === "privacidad" && <MisAceptaciones />}
      {pestana === "arco" && <DerechosArco />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan y licencia: summary, constancias and plan cancellation
// ---------------------------------------------------------------------------

function PlanYLicencia() {
  const { estado, despachar } = useSimulador();
  const { licencia, constancias, administrador } = estado.legal;
  const plan = resumenPlan(estado);
  const fin = finDeTemporada(estado);
  const limiteAviso = fin ? sumarDiasISO(fin, -30) : null;
  const temporada = estado.temporadas.find((t) => t.id === estado.liga.temporadaActivaId);
  const [verConstancia, setVerConstancia] = useState<ConstanciaAceptacion | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState<MotivoCancelacion>("costo");
  const [detalle, setDetalle] = useState("");
  const [entiende, setEntiende] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intencionEstado =
    licencia.estado === "activa" ? "ok" : licencia.estado === "pendiente" ? "warn" : "danger";

  function confirmarCancelacion() {
    const r = despachar({ tipo: "cancelarPlan", motivo, detalle, efectivaEl: fin ?? "" });
    if (!r.ok) {
      setError(r.motivo ?? "No se pudo cancelar");
      return;
    }
    setCancelando(false);
    setError(null);
  }

  function descargarDatos() {
    const { liga, temporadas, categorias, equipos, jugadores, partidos } = estado;
    const datos = { exportadoEl: new Date().toISOString(), formato: "JSON", liga, temporadas, categorias, equipos, jugadores, partidos };
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datos-liga-${fechaHoy()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    despachar({ tipo: "registrarDescargaDatos", formato: "JSON" });
  }

  return (
    <div className="space-y-4" data-testid="plan-licencia">
      {licencia.estado === "pendiente" && (
        <Aviso intencion="warn">
          La licencia de la temporada no está activa: el representante del cliente debe aceptar las Condiciones
          de Uso y Licencia.{" "}
          <Link href="/licencia" className="underline">
            Aceptar ahora
          </Link>
        </Aviso>
      )}

      {licencia.estado === "cancelacion_programada" && licencia.cancelacion && (
        <Aviso intencion="danger" icono={CalendarClock} data-testid="aviso-cancelacion">
          Cancelación programada. El servicio sigue activo hasta el{" "}
          <strong>{fechaLarga(licencia.cancelacion.efectivaEl)}</strong> y la licencia no se renovará. Después
          entregamos los datos de la liga en formato abierto y los suprimimos, incluidos los respaldos al vencer su
          ciclo (cláusula 17).
        </Aviso>
      )}

      <Tarjeta className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Plan contratado</p>
            <h2 className="text-lg font-semibold text-ink">Licencia por temporada · {temporada?.nombre}</h2>
            <p className="text-sm text-muted">{administrador.entidad}</p>
          </div>
          <Etiqueta intencion={intencionEstado} data-testid="estado-licencia">
            {ETIQUETA_ESTADO_LICENCIA[licencia.estado]}
          </Etiqueta>
        </div>

        <div className="overflow-hidden rounded-2xl ring-1 ring-ink/5">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-canvas">
                <td className="px-4 py-2 text-muted">Equipos inscritos</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">
                  {plan.equipos} × {pesos(licencia.precioPorEquipo)}
                </td>
              </tr>
              <tr className="border-b border-canvas">
                <td className="px-4 py-2 text-muted">Subtotal</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{pesos(plan.subtotal)}</td>
              </tr>
              <tr className="border-b border-canvas">
                <td className="px-4 py-2 text-muted">IVA ({licencia.tasaIva * 100} %)</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{pesos(plan.iva)}</td>
              </tr>
              <tr className="bg-canvas">
                <td className="px-4 py-2 font-semibold text-ink">Total de la temporada</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-ink">{pesos(plan.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-canvas px-4 py-3">
            <dt className="text-xs text-muted">Fin de la temporada</dt>
            <dd className="font-medium text-ink">{fin ? fechaLarga(fin) : "Sin calendario"}</dd>
          </div>
          <div className="rounded-2xl bg-canvas px-4 py-3">
            <dt className="text-xs text-muted">Renovación</dt>
            <dd className="font-medium text-ink">
              {licencia.estado === "cancelacion_programada"
                ? "No se renovará"
                : `Automática · aviso de no renovación hasta el ${limiteAviso ? fechaLarga(limiteAviso) : "—"}`}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2 border-t border-canvas pt-4">
          {licencia.estado === "activa" && (
            <Boton intencion="danger" variante="contorno" onClick={() => setCancelando(true)} data-testid="boton-cancelar-plan">
              <XCircle size={16} />
              Cancelar plan
            </Boton>
          )}
          {licencia.estado === "cancelacion_programada" && (
            <Boton
              intencion="neutral"
              variante="suave"
              onClick={() => despachar({ tipo: "revertirCancelacionPlan" })}
              data-testid="boton-revertir-cancelacion"
            >
              <RotateCcw size={16} />
              Revertir cancelación
            </Boton>
          )}
          <Boton intencion="neutral" variante="suave" onClick={descargarDatos} data-testid="boton-descargar-datos">
            <Download size={16} />
            Descargar datos de la liga (JSON)
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <FileCheck size={18} className="text-accent" /> Constancias de aceptación
        </h2>
        {constancias.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay constancias: las Condiciones no se han aceptado.</p>
        ) : (
          <ul className="space-y-2">
            {constancias.map((c) => (
              <li key={c.folio} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-canvas px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">
                    {c.folio} · {c.documento} v{c.version}
                  </p>
                  <p className="text-xs text-muted">
                    {c.representante} · {fechaHora(c.recibidaEl)} · huella {huellaCorta(c.huellaTexto)}
                  </p>
                </div>
                <Boton variante="texto" onClick={() => setVerConstancia(c)}>
                  Ver constancia
                </Boton>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Modal abierto={!!verConstancia} onCerrar={() => setVerConstancia(null)} titulo="Constancia de aceptación" ancho="max-w-3xl">
        {verConstancia && <VistaConstancia constancia={verConstancia} />}
      </Modal>

      <Modal abierto={cancelando} onCerrar={() => setCancelando(false)} titulo="Cancelar el plan de la liga" testId="modal-cancelar-plan">
        <div className="space-y-4 text-sm">
          <Aviso intencion="warn" icono={AlertTriangle}>
            Cancelar es avisar que no renuevas: no hay penalización y no se cobra la siguiente temporada
            (cláusulas 16 y 17 de las Condiciones).
          </Aviso>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>El servicio sigue activo hasta el fin de la temporada{fin ? ` (${fechaLarga(fin)})` : ""}.</li>
            <li>Al terminar, A&amp;I entrega los datos de la liga en formato abierto y estructurado.</li>
            <li>Después los suprime, incluidos los respaldos al vencer su ciclo, y lo confirma por escrito.</li>
            <li>Las constancias de aceptación se conservan diez años como prueba (Código de Comercio, art. 49).</li>
            <li>Puedes revertir la cancelación mientras la temporada siga activa.</li>
          </ul>
          <Campo etiqueta="Motivo">
            <select className={claseCampo} value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoCancelacion)} data-testid="campo-motivo-cancelacion">
              {Object.entries(ETIQUETA_MOTIVO_CANCELACION).map(([id, texto]) => (
                <option key={id} value={id}>
                  {texto}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta={motivo === "otro" ? "Detalle (obligatorio)" : "Detalle (opcional)"}>
            <textarea className={`${claseCampo} min-h-20 py-2`} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          </Campo>
          <label className="flex items-start gap-3 text-ink">
            <input type="checkbox" checked={entiende} onChange={(e) => setEntiende(e.target.checked)} className="mt-0.5" data-testid="casilla-entiendo-cancelacion" />
            <span>Entiendo que la liga deja de operar en la plataforma al terminar la temporada y que sus datos se entregan y después se suprimen.</span>
          </label>
          {error && <Aviso intencion="danger">{error}</Aviso>}
          <div className="flex flex-wrap justify-end gap-2">
            <Boton intencion="neutral" variante="texto" onClick={() => setCancelando(false)}>
              Conservar mi plan
            </Boton>
            <Boton intencion="danger" disabled={!entiende} onClick={confirmarCancelacion} data-testid="boton-confirmar-cancelacion">
              Confirmar cancelación
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mis aceptaciones: what this user accepted, with version and hash
// ---------------------------------------------------------------------------

function MisAceptaciones() {
  const { estado } = useSimulador();
  const usuario = usuarioActual(estado)!;
  const mias = estado.legal.aceptaciones.filter((a) => a.usuario === usuario.clave);

  return (
    <div className="space-y-4" data-testid="mis-aceptaciones">
      <Tarjeta className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Registro de mis aceptaciones</h2>
        {mias.map((a) => (
          <div key={a.id} className="space-y-2 rounded-2xl bg-canvas p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-ink">Términos de uso v{a.versionTerminos}</p>
              <Etiqueta intencion="ok">Aceptados</Etiqueta>
            </div>
            <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
              <dt className="text-muted">Fecha y hora</dt>
              <dd className="text-ink">{fechaHora(a.fecha)}</dd>
              <dt className="text-muted">Huella de los Términos</dt>
              <dd className="font-mono text-ink">{huellaCorta(a.huellaTerminos)}</dd>
              <dt className="text-muted">Aviso de privacidad mostrado</dt>
              <dd className="text-ink">
                v{a.versionAviso} · <span className="font-mono">{huellaCorta(a.huellaAviso)}</span>
              </dd>
              <dt className="text-muted">Dispositivo</dt>
              <dd className="text-ink">{a.dispositivo}</dd>
            </dl>
            <ul className="list-disc pl-5 text-xs text-muted">
              {a.casillas.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Link href="/privacidad">
            <Boton variante="suave">Consultar el aviso de privacidad</Boton>
          </Link>
          <Link href="/legal?doc=terminos">
            <Boton variante="texto" intencion="neutral">
              Leer los Términos de uso
            </Boton>
          </Link>
        </div>
      </Tarjeta>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Derechos ARCO: request with folio and legal deadline; admin inbox
// ---------------------------------------------------------------------------

function DerechosArco() {
  const { estado, despachar } = useSimulador();
  const usuario = usuarioActual(estado)!;
  const esAdmin = usuario.rol === "administrador";
  const hoy = fechaHoy();
  const [tipo, setTipo] = useState<TipoArco>("acceso");
  const [descripcion, setDescripcion] = useState("");
  const [medio, setMedio] = useState(usuario.correo);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const solicitudes = estado.legal.solicitudesArco
    .filter((s) => esAdmin || s.usuario === usuario.clave)
    .slice()
    .reverse();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const r = despachar({
      tipo: "crearSolicitudArco",
      solicitud: { tipo, descripcion, medio, usuario: usuario.clave, nombre: usuario.nombre },
    });
    if (!r.ok) {
      setMensaje({ ok: false, texto: r.motivo ?? "No se pudo enviar" });
      return;
    }
    setDescripcion("");
    setMensaje({ ok: true, texto: "Solicitud recibida. Te enviamos el folio de seguimiento a tu correo." });
  }

  return (
    <div className="space-y-4" data-testid="derechos-arco">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["acceso", "rectificacion", "cancelacion", "oposicion"] as TipoArco[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`rounded-2xl px-3 py-3 text-left text-sm shadow-suave transition-colors ${
              tipo === t ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-control/60"
            }`}
          >
            <span className="block font-semibold">{ETIQUETA_ARCO[t]}</span>
            <span className={`text-xs ${tipo === t ? "text-paper/70" : "text-muted"}`}>
              {
                {
                  acceso: "Copia de mis datos",
                  rectificacion: "Corregir un dato",
                  cancelacion: "Bloqueo y supresión",
                  oposicion: "Dejar de tratar o revisar una decisión",
                  revocacion: "",
                }[t]
              }
            </span>
          </button>
        ))}
      </div>

      <Tarjeta>
        <form onSubmit={enviar} className="space-y-4">
          <p className="text-sm text-muted">
            Titular: <span className="font-medium text-ink">{usuario.nombre}</span>. La responde la Unidad de
            Transparencia del Municipio en máximo <strong>20 días hábiles</strong>; A&amp;I, como encargada, la
            turna en máximo 2 días hábiles.
          </p>
          <Campo etiqueta={`Describe tu solicitud de ${ETIQUETA_ARCO[tipo].toLowerCase()}`}>
            <textarea
              className={`${claseCampo} min-h-24 py-2`}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Por ejemplo: solicito una copia de los datos personales asociados a mi cuenta."
              data-testid="campo-descripcion-arco"
            />
          </Campo>
          <Campo etiqueta="Correo para recibir la respuesta">
            <input type="email" className={claseCampo} value={medio} onChange={(e) => setMedio(e.target.value)} />
          </Campo>
          {mensaje && <Aviso intencion={mensaje.ok ? "ok" : "danger"}>{mensaje.texto}</Aviso>}
          <Boton type="submit" data-testid="boton-enviar-arco">
            <Send size={16} />
            Enviar solicitud
          </Boton>
        </form>
      </Tarjeta>

      <Tarjeta className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Inbox size={18} className="text-accent" /> {esAdmin ? "Bandeja de solicitudes ARCO" : "Mis solicitudes"}
        </h2>
        {solicitudes.length === 0 ? (
          <EstadoVacio icono={Inbox} titulo="Sin solicitudes" descripcion="Aquí verás el folio, el plazo legal y el estado de cada solicitud." />
        ) : (
          <ul className="space-y-2" data-testid="lista-arco">
            {solicitudes.map((s) => {
              const restantes = diasHabilesEntre(hoy, s.venceEl);
              return (
                <li key={s.folio} className="space-y-2 rounded-2xl bg-canvas p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">
                      {s.folio} · {ETIQUETA_ARCO[s.tipo]}
                    </p>
                    <Etiqueta intencion={s.estado === "recibida" ? "warn" : s.estado === "turnada" ? "accent" : "ok"}>
                      {s.estado === "recibida" ? "Recibida" : s.estado === "turnada" ? "Turnada a Transparencia" : "Respondida"}
                    </Etiqueta>
                  </div>
                  <p className="text-muted">{s.descripcion}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      {s.nombre} · recibida {fechaHora(s.fecha)} · vence el {fechaLarga(s.venceEl)} (
                      <strong className="text-ink">{restantes} días hábiles</strong>)
                    </span>
                    {esAdmin && s.estado === "recibida" && (
                      <Boton variante="suave" onClick={() => despachar({ tipo: "turnarSolicitudArco", folio: s.folio })}>
                        Turnar a la Unidad de Transparencia
                        <ArrowRight size={14} />
                      </Boton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Tarjeta>
    </div>
  );
}
