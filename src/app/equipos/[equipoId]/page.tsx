"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, UserPlus } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { estadoRegistro } from "@/lib/rules";
import { fechaHoy } from "@/lib/fechas";
import { puedeInscribirEn, puedeVerPlantel } from "@/lib/permisos";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import AccesoRestringido from "@/components/AccesoRestringido";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import FormularioJugador, {
  type DatosNuevoJugadorFormulario,
} from "@/components/equipos/FormularioJugador";
import FilaJugador from "@/components/equipos/FilaJugador";

export default function DetalleEquipoPage() {
  const params = useParams<{ equipoId: string }>();
  const router = useRouter();
  const { estado, despachar } = useSimulador();
  const { equipos, categorias, jugadores, rolActual, equipoDelegadoId } = estado;

  const equipo = equipos.find((e) => e.id === params.equipoId);
  const categoria = equipo ? categorias.find((c) => c.id === equipo.categoriaId) : undefined;

  if (!equipo || !categoria) {
    return (
      <div className="mx-auto max-w-2xl">
        <EstadoVacio
          icono={ICONO_SECCION.equipos}
          titulo="Equipo no encontrado"
          descripcion="Este equipo no existe o fue eliminado."
          accion={<Boton onClick={() => router.push("/equipos")}>Volver a equipos</Boton>}
        />
      </div>
    );
  }

  // RNF-08: the roster shows minors' ages and eligibility. Only the admin and
  // this team's own delegate may open it, even through a direct URL.
  if (!puedeVerPlantel(rolActual, equipoDelegadoId, equipo.id)) {
    return (
      <AccesoRestringido descripcion="El plantel contiene datos personales de los jugadores, incluidos menores de edad. Solo el administrador de la liga y el delegado de este equipo pueden consultarlo." />
    );
  }

  const plantel = jugadores
    .filter((j) => j.equipoId === equipo.id)
    .sort((a, b) => (a.numero ?? 99) - (b.numero ?? 99));
  const registro = estadoRegistro(categoria, fechaHoy());
  const plantelLleno =
    plantel.length >= categoria.limiteJugadoresPorPlantel
      ? `El plantel ya tiene el máximo de ${categoria.limiteJugadoresPorPlantel} jugadores permitido en ${categoria.nombre}.`
      : undefined;

  function manejarGuardarJugador(datos: DatosNuevoJugadorFormulario) {
    return despachar({ tipo: "crearJugador", datos: { ...datos, equipoId: equipo!.id } });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        onClick={() => router.push("/equipos")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft size={16} />
        Equipos
      </button>

      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{equipo.nombre}</h1>
        <p className="text-sm text-muted">
          {categoria.nombre} · Delegado: {equipo.delegado.nombre} ({equipo.delegado.telefono})
        </p>
        <p className="text-sm text-muted">
          {plantel.length} / {categoria.limiteJugadoresPorPlantel} jugadores en el plantel
        </p>
      </div>

      {registro === "cerrado" && (
        <Aviso intencion="warn" icono={Lock}>
          El registro de {categoria.nombre} está cerrado desde el {categoria.fechaCierreRegistro}.
          El plantel es de solo lectura.
        </Aviso>
      )}
      {registro === "extemporaneo" && (
        <Aviso intencion="accent" data-testid="aviso-ventana-extemporanea">
          Ventana de altas extemporáneas abierta hasta el{" "}
          {categoria.ventanaExtemporanea?.hasta}: {categoria.ventanaExtemporanea?.motivo}
        </Aviso>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold text-ink">Plantel</h2>
        {plantel.length === 0 ? (
          <EstadoVacio
            icono={ICONO_SECCION.equipos}
            titulo="Sin jugadores inscritos"
            descripcion="Agrega jugadores usando el formulario de inscripción."
          />
        ) : (
          plantel.map((jugador) => (
            <FilaJugador
              key={jugador.id}
              jugador={jugador}
              esAdministrador={rolActual === "administrador"}
              onGuardarOverride={(elegibleForzado, motivo) =>
                despachar({
                  tipo: "establecerOverrideAdmin",
                  jugadorId: jugador.id,
                  override: elegibleForzado
                    ? { elegibleForzado, motivo, fecha: new Date().toISOString() }
                    : undefined,
                })
              }
            />
          ))
        )}
      </section>

      {registro !== "cerrado" && puedeInscribirEn(rolActual, equipoDelegadoId, equipo.id) && (
        <Tarjeta>
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
            <UserPlus size={18} className="text-accent" />
            {registro === "extemporaneo" ? "Alta extemporánea de jugador" : "Inscribir jugador"}
          </h2>
          <FormularioJugador onGuardar={manejarGuardarJugador} plantelLleno={plantelLleno} />
        </Tarjeta>
      )}
    </div>
  );
}
