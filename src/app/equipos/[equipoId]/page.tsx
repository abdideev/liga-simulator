"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, UserPlus, Users } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Boton from "@/components/ui/Boton";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import FormularioJugador, {
  type DatosNuevoJugadorFormulario,
} from "@/components/equipos/FormularioJugador";
import FilaJugador from "@/components/equipos/FilaJugador";

export default function DetalleEquipoPage() {
  const params = useParams<{ equipoId: string }>();
  const router = useRouter();
  const { estado, crearJugador, establecerOverrideAdmin } = useSimulador();
  const { equipos, categorias, jugadores, rolActual } = estado;

  const equipo = equipos.find((e) => e.id === params.equipoId);
  const categoria = equipo ? categorias.find((c) => c.id === equipo.categoriaId) : undefined;
  const plantel = jugadores
    .filter((j) => j.equipoId === params.equipoId)
    .sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99));

  if (!equipo || !categoria) {
    return (
      <div className="mx-auto max-w-2xl">
        <EstadoVacio
          icono={Users}
          titulo="Equipo no encontrado"
          descripcion="Este equipo no existe o fue eliminado."
          accion={<Boton onClick={() => router.push("/equipos")}>Volver a equipos</Boton>}
        />
      </div>
    );
  }

  function manejarGuardarJugador(datos: DatosNuevoJugadorFormulario) {
    return crearJugador({ ...datos, equipoId: equipo!.id });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <button
        onClick={() => router.push("/equipos")}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Equipos
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">{equipo.nombre}</h1>
        <p className="text-sm text-gray-600">
          {categoria.nombre} · Delegado: {equipo.delegado.nombre} ({equipo.delegado.telefono})
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {plantel.length} / {categoria.limiteJugadoresPorPlantel} jugadores en el plantel
        </p>
      </div>

      {categoria.registroCerrado && (
        <div className="flex items-center gap-2 rounded-lg border border-(--color-warning) bg-(--color-warning-light) px-3 py-2 text-sm font-medium text-(--color-warning)">
          <Lock size={16} />
          El registro de {categoria.nombre} está cerrado desde el{" "}
          {categoria.fechaCierreRegistro}. El plantel es de solo lectura.
        </div>
      )}

      <div>
        <h2 className="mb-2 font-semibold text-gray-900">Plantel</h2>
        {plantel.length === 0 ? (
          <EstadoVacio
            icono={Users}
            titulo="Sin jugadores inscritos"
            descripcion="Agrega jugadores usando el formulario de inscripción."
          />
        ) : (
          <div className="space-y-2">
            {plantel.map((jugador) => (
              <FilaJugador
                key={jugador.id}
                jugador={jugador}
                esAdministrador={rolActual === "administrador"}
                onGuardarOverride={(elegibleForzado, motivo) =>
                  establecerOverrideAdmin(
                    jugador.id,
                    elegibleForzado ? { elegibleForzado, motivo, fecha: new Date().toISOString() } : undefined
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {!categoria.registroCerrado && rolActual !== "publico" && (
        <Tarjeta>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
            <UserPlus size={18} className="text-(--color-primary)" />
            Inscribir jugador
          </h2>
          <FormularioJugador onGuardar={manejarGuardarJugador} />
        </Tarjeta>
      )}
    </div>
  );
}
