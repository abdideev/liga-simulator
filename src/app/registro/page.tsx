"use client";

import { useState } from "react";
import { CalendarClock, CheckCircle2, Lock, LockOpen } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { estadoRegistro } from "@/lib/rules";
import { fechaHoy, sumarDiasISO } from "@/lib/fechas";
import type { Categoria } from "@/lib/types";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Etiqueta from "@/components/ui/Etiqueta";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { ICONO_SECCION } from "@/components/iconosSeccion";

type Formulario = { categoriaId: string; tipo: "cierre" | "ventana" } | null;

const ETIQUETA_ESTADO = {
  abierto: { intencion: "ok", icono: LockOpen, texto: "Abierto" },
  extemporaneo: { intencion: "warn", icono: CalendarClock, texto: "Ventana extemporánea" },
  cerrado: { intencion: "neutral", icono: CheckCircle2, texto: "Cerrado" },
} as const;

function EtiquetaRegistro({ estado }: { estado: keyof typeof ETIQUETA_ESTADO }) {
  const { intencion, icono, texto } = ETIQUETA_ESTADO[estado];
  return (
    <Etiqueta intencion={intencion} icono={icono}>
      {texto}
    </Etiqueta>
  );
}

const TEXTO_FORMULARIO = {
  cierre: {
    campoFecha: "Fecha de cierre",
    intencion: "danger",
    testId: "boton-confirmar-cierre",
    boton: "Confirmar cierre de registro",
  },
  ventana: {
    campoFecha: "Altas permitidas hasta",
    intencion: "warn",
    testId: "boton-confirmar-ventana",
    boton: "Abrir ventana extemporánea",
  },
} as const;

export default function CierreRegistroPage() {
  const { estado, despachar } = useSimulador();
  const { categorias, equipos, jugadores } = estado;
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [fecha, setFecha] = useState(fechaHoy());
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hoy = fechaHoy();

  function abrirFormulario(categoriaId: string, tipo: "cierre" | "ventana") {
    setFormulario({ categoriaId, tipo });
    setFecha(tipo === "cierre" ? hoy : sumarDiasISO(hoy, 7));
    setMotivo("");
    setError(null);
  }

  function confirmar(categoria: Categoria) {
    const resultado =
      formulario?.tipo === "cierre"
        ? despachar({ tipo: "cerrarRegistroCategoria", categoriaId: categoria.id, fecha })
        : despachar({
            tipo: "abrirVentanaExtemporanea",
            categoriaId: categoria.id,
            hasta: fecha,
            motivo,
          });
    if (!resultado.ok) {
      setError(resultado.motivo ?? "No se pudo completar la acción");
      return;
    }
    setFormulario(null);
  }

  if (categorias.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <EstadoVacio
          icono={Lock}
          titulo="No hay categorías configuradas"
          descripcion="Crea al menos una categoría en Configuración de liga antes de cerrar el registro."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.registro}
        titulo="Cierre de registro"
        descripcion="Congela los planteles de una categoría en una fecha determinada. Después del cierre, el administrador puede abrir una ventana puntual de altas extemporáneas."
      />

      <div className="space-y-3">
        {categorias.map((categoria) => {
          const equiposCat = equipos.filter((e) => e.categoriaId === categoria.id);
          const jugadoresCat = jugadores.filter((j) =>
            equiposCat.some((e) => e.id === j.equipoId)
          );
          const extemporaneos = jugadoresCat.filter((j) => j.altaExtemporanea).length;
          const estadoActual = estadoRegistro(categoria, hoy);
          const formularioAbierto = formulario?.categoriaId === categoria.id;

          return (
            <Tarjeta key={categoria.id} data-testid={`registro-${categoria.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{categoria.nombre}</p>
                  <p className="text-sm text-muted">
                    {equiposCat.length} equipos · {jugadoresCat.length} jugadores inscritos
                    {extemporaneos > 0 && ` · ${extemporaneos} alta(s) extemporánea(s)`}
                  </p>
                </div>
                <EtiquetaRegistro estado={estadoActual} />
              </div>

              {categoria.registroCerrado && (
                <p className="mt-2 text-xs font-medium text-muted">
                  Registro congelado el {categoria.fechaCierreRegistro}
                </p>
              )}

              {categoria.ventanaExtemporanea && (
                <Aviso intencion={estadoActual === "extemporaneo" ? "warn" : "accent"} className="mt-3">
                  {estadoActual === "extemporaneo" ? "Altas extemporáneas abiertas" : "Ventana vencida"}{" "}
                  del {categoria.ventanaExtemporanea.abiertaEl} al{" "}
                  {categoria.ventanaExtemporanea.hasta}. Motivo: {categoria.ventanaExtemporanea.motivo}
                </Aviso>
              )}

              {formularioAbierto ? (
                <div className="mt-5 space-y-4 rounded-2xl bg-canvas p-4">
                  <Campo
                    etiqueta={TEXTO_FORMULARIO[formulario.tipo].campoFecha}
                  >
                    <input
                      type="date"
                      className={claseCampo}
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      data-testid="campo-fecha-registro"
                    />
                  </Campo>
                  {formulario.tipo === "ventana" && (
                    <Campo
                      etiqueta="Motivo de la ventana"
                      ayuda="Queda registrado en la bitácora como aprobación del administrador."
                    >
                      <input
                        className={claseCampo}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ej. Lesión de portero titular en Tigres del Valle"
                        data-testid="campo-motivo-ventana"
                      />
                    </Campo>
                  )}
                  <p className="text-xs text-muted">
                    {formulario.tipo === "cierre"
                      ? `Esta acción congelará el plantel de ${equiposCat.length} equipo(s). No podrás inscribir más jugadores en ${categoria.nombre} salvo que abras una ventana extemporánea.`
                      : `Durante la ventana, el administrador y los delegados de ${categoria.nombre} podrán dar de alta jugadores; cada alta queda marcada como extemporánea.`}
                  </p>
                  {error && <Aviso intencion="danger">{error}</Aviso>}
                  <div className="flex flex-wrap gap-2">
                    <Boton
                      intencion={TEXTO_FORMULARIO[formulario.tipo].intencion}
                      onClick={() => confirmar(categoria)}
                      data-testid={TEXTO_FORMULARIO[formulario.tipo].testId}
                    >
                      {TEXTO_FORMULARIO[formulario.tipo].boton}
                    </Boton>
                    <Boton intencion="neutral" variante="contorno" onClick={() => setFormulario(null)}>
                      Cancelar
                    </Boton>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {!categoria.registroCerrado && (
                    <Boton
                      intencion="neutral"
                      variante="contorno"
                      onClick={() => abrirFormulario(categoria.id, "cierre")}
                      data-testid={`boton-cerrar-registro-${categoria.id}`}
                    >
                      <Lock size={16} />
                      Cerrar registro
                    </Boton>
                  )}
                  {categoria.registroCerrado && estadoActual !== "extemporaneo" && (
                    <Boton
                      intencion="warn"
                      variante="suave"
                      onClick={() => abrirFormulario(categoria.id, "ventana")}
                      data-testid={`boton-abrir-ventana-${categoria.id}`}
                    >
                      <CalendarClock size={16} />
                      Abrir ventana extemporánea
                    </Boton>
                  )}
                  {categoria.ventanaExtemporanea && (
                    <Boton
                      intencion="neutral"
                      variante="contorno"
                      onClick={() =>
                        despachar({ tipo: "cerrarVentanaExtemporanea", categoriaId: categoria.id })
                      }
                      data-testid={`boton-cerrar-ventana-${categoria.id}`}
                    >
                      Cerrar ventana
                    </Boton>
                  )}
                </div>
              )}
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
