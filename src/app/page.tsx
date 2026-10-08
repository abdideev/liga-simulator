"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Calendar, Eye, ShieldAlert, Users } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { calcularEstadisticasJugadores, estadoRegistro } from "@/lib/rules";
import { fechaHoy } from "@/lib/fechas";
import Tarjeta from "@/components/ui/Tarjeta";
import Boton from "@/components/ui/Boton";
import Etiqueta from "@/components/ui/Etiqueta";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { ICONO_SECCION } from "@/components/iconosSeccion";

const ETIQUETA_REGISTRO = {
  abierto: { texto: "Registro abierto", intencion: "ok" },
  extemporaneo: { texto: "Ventana extemporánea", intencion: "warn" },
  cerrado: { texto: "Registro cerrado", intencion: "neutral" },
} as const;

export default function InicioPage() {
  const { estado } = useSimulador();
  const { liga, temporadas, categorias, equipos, jugadores, partidos, rolActual } = estado;
  const temporadaActiva = temporadas.find((t) => t.id === liga.temporadaActivaId);
  const hoy = fechaHoy();

  if (rolActual === "publico") {
    return (
      <div className="mx-auto max-w-2xl">
        <Tarjeta className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <Eye size={24} />
          </span>
          <h1 className="text-xl font-semibold text-ink">{liga.nombre}</h1>
          <p className="text-sm text-muted">{temporadaActiva?.nombre}</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Consulta el calendario, los resultados, la tabla de posiciones y las estadísticas de
            la liga.
          </p>
          <Link href="/publico" className="mt-4">
            <Boton>
              Ir a la vista pública
              <ArrowRight size={16} />
            </Boton>
          </Link>
        </Tarjeta>
      </div>
    );
  }

  const partidosHoy = partidos.filter((p) => p.fecha === hoy && p.estado !== "finalizado").length;
  const partidosProgramados = partidos.filter((p) => p.estado === "programado").length;
  const revisionManual = jugadores.filter(
    (j) => j.estadoElegibilidad === "Requiere revisión manual" && !j.overrideAdmin
  ).length;
  const suspendidos = calcularEstadisticasJugadores(jugadores, partidos).filter(
    (e) => e.suspendido
  ).length;

  const tarjetas = [
    {
      href: "/equipos",
      icono: Users,
      titulo: "Equipos",
      valor: `${equipos.length}`,
      detalle: `${jugadores.length} jugadores inscritos`,
    },
    {
      href: "/calendario",
      icono: Calendar,
      titulo: "Partidos por jugar",
      valor: `${partidosProgramados}`,
      detalle: partidosHoy > 0 ? `${partidosHoy} programado(s) para hoy` : "Ninguno programado hoy",
    },
    {
      href: "/equipos",
      icono: AlertTriangle,
      titulo: "Revisión manual",
      valor: `${revisionManual}`,
      detalle: "Jugadores con CURP inconsistente",
    },
    {
      href: "/estadisticas",
      icono: ShieldAlert,
      titulo: "Suspendidos",
      valor: `${suspendidos}`,
      detalle: "Para el siguiente partido de su equipo",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.inicio}
        titulo={liga.nombre}
        descripcion={temporadaActiva?.nombre}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tarjetas.map((t) => (
          <Link key={t.titulo} href={t.href} data-testid={`tarjeta-inicio-${t.titulo.toLowerCase().replace(/\s+/g, "-")}`}>
            <Tarjeta className="h-full transition-shadow hover:shadow-md">
              <t.icono className="text-accent" size={20} />
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{t.valor}</p>
              <p className="text-sm font-semibold text-ink">{t.titulo}</p>
              <p className="text-xs text-muted">{t.detalle}</p>
            </Tarjeta>
          </Link>
        ))}
      </div>

      <Tarjeta>
        <h2 className="mb-3 font-semibold text-ink">Categorías activas</h2>
        <ul className="divide-y divide-border">
          {categorias.map((cat) => {
            const equiposCat = equipos.filter((e) => e.categoriaId === cat.id).length;
            const registro = ETIQUETA_REGISTRO[estadoRegistro(cat, hoy)];
            return (
              <li key={cat.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{cat.nombre}</p>
                  <p className="text-xs text-muted">{equiposCat} equipos</p>
                </div>
                <Etiqueta intencion={registro.intencion}>{registro.texto}</Etiqueta>
              </li>
            );
          })}
        </ul>
      </Tarjeta>
    </div>
  );
}
