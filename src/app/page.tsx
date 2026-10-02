"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Eye,
  ShieldAlert,
  Users,
} from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { calcularEstadisticasJugadores } from "@/lib/rules";
import Tarjeta from "@/components/ui/Tarjeta";
import Boton from "@/components/ui/Boton";

export default function InicioPage() {
  const { estado } = useSimulador();
  const { liga, temporadas, categorias, equipos, jugadores, partidos, rolActual } = estado;
  const temporadaActiva = temporadas.find((t) => t.id === liga.temporadaActivaId);

  const partidosProgramados = partidos.filter((p) => p.estado === "programado").length;
  const revisionManual = jugadores.filter(
    (j) => j.estadoElegibilidad === "Requiere revisión manual" && !j.overrideAdmin
  ).length;
  const estadisticas = calcularEstadisticasJugadores(jugadores, partidos, equipos);
  const suspendidos = estadisticas.filter((e) => e.suspendido).length;

  if (rolActual === "publico") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Tarjeta className="text-center">
          <Eye className="mx-auto mb-2 text-(--color-primary)" size={32} />
          <h1 className="text-lg font-bold text-gray-900">{liga.nombre}</h1>
          <p className="mt-1 text-sm text-gray-600">{temporadaActiva?.nombre}</p>
          <p className="mt-4 text-sm text-gray-600">
            Consulta el calendario, los resultados, la tabla de posiciones y las
            estadísticas de la liga.
          </p>
          <Link href="/publico" className="mt-4 inline-block">
            <Boton>Ir a la vista pública</Boton>
          </Link>
        </Tarjeta>
      </div>
    );
  }

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
      icono: CalendarDays,
      titulo: "Próxima jornada",
      valor: `${partidosProgramados}`,
      detalle: "Partidos programados",
    },
    {
      href: "/partidos",
      icono: ClipboardList,
      titulo: "Revisión manual",
      valor: `${revisionManual}`,
      detalle: "Jugadores con CURP inconsistente",
    },
    {
      href: "/estadisticas",
      icono: ShieldAlert,
      titulo: "Suspendidos",
      valor: `${suspendidos}`,
      detalle: "Para la próxima jornada",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{liga.nombre}</h1>
        <p className="text-sm text-gray-600">{temporadaActiva?.nombre}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tarjetas.map((t) => (
          <Link key={t.href} href={t.href}>
            <Tarjeta className="h-full transition-colors hover:border-(--color-primary)">
              <t.icono className="text-(--color-primary)" size={20} />
              <p className="mt-2 text-2xl font-bold text-gray-900">{t.valor}</p>
              <p className="text-sm font-semibold text-gray-800">{t.titulo}</p>
              <p className="text-xs text-gray-500">{t.detalle}</p>
            </Tarjeta>
          </Link>
        ))}
      </div>

      <Tarjeta>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
          <BarChart3 size={18} className="text-(--color-primary)" />
          Categorías activas
        </h2>
        <ul className="divide-y divide-(--color-border)">
          {categorias.map((cat) => {
            const equiposCat = equipos.filter((e) => e.categoriaId === cat.id).length;
            return (
              <li key={cat.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-gray-800">{cat.nombre}</span>
                <span className="text-gray-500">
                  {equiposCat} equipos · {cat.registroCerrado ? "Registro cerrado" : "Registro abierto"}
                </span>
              </li>
            );
          })}
        </ul>
      </Tarjeta>
    </div>
  );
}
