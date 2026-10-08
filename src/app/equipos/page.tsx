"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock, Plus } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import { puedeVerPlantel } from "@/lib/permisos";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { ICONO_SECCION } from "@/components/iconosSeccion";

export default function EquiposPage() {
  const { estado, despachar } = useSimulador();
  const { categorias, equipos, jugadores, rolActual, equipoDelegadoId } = estado;
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [delegadoNombre, setDelegadoNombre] = useState("");
  const [delegadoTelefono, setDelegadoTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    const resultado = despachar({
      tipo: "crearEquipo",
      datos: {
        nombre,
        categoriaId,
        delegado: { nombre: delegadoNombre, telefono: delegadoTelefono },
      },
    });
    if (!resultado.ok) {
      setError(resultado.motivo ?? "No se pudo registrar el equipo");
      return;
    }
    setNombre("");
    setDelegadoNombre("");
    setDelegadoTelefono("");
    setError(null);
    setMostrarNuevo(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.equipos}
        titulo="Equipos"
        descripcion={`${equipos.length} equipo(s) registrados en ${categorias.length} categoría(s)`}
        accion={
          rolActual === "administrador" &&
          !mostrarNuevo && (
            <Boton onClick={() => setMostrarNuevo(true)} data-testid="boton-nuevo-equipo">
              <Plus size={16} />
              Nuevo equipo
            </Boton>
          )
        }
      />

      {mostrarNuevo && (
        <Tarjeta>
          <h2 className="mb-4 font-semibold text-ink">Registrar equipo</h2>
          <form onSubmit={manejarEnvio} className="space-y-4" data-testid="formulario-equipo">
            <Campo etiqueta="Nombre del equipo">
              <input
                className={claseCampo}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Real Tlahuelilpan FC"
              />
            </Campo>
            <Campo etiqueta="Categoría">
              <select
                className={claseCampo}
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Campo etiqueta="Nombre del delegado">
                <input
                  className={claseCampo}
                  value={delegadoNombre}
                  onChange={(e) => setDelegadoNombre(e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Teléfono del delegado">
                <input
                  className={claseCampo}
                  value={delegadoTelefono}
                  onChange={(e) => setDelegadoTelefono(e.target.value)}
                  placeholder="771 123 4567"
                />
              </Campo>
            </div>
            {error && <p className="text-sm font-medium text-danger-ink">{error}</p>}
            <div className="flex gap-2">
              <Boton type="submit">Registrar equipo</Boton>
              <Boton intencion="neutral" variante="contorno" onClick={() => setMostrarNuevo(false)}>
                Cancelar
              </Boton>
            </div>
          </form>
        </Tarjeta>
      )}

      {equipos.length === 0 && !mostrarNuevo && (
        <EstadoVacio
          icono={ICONO_SECCION.equipos}
          titulo="Todavía no hay equipos registrados"
          descripcion="Registra el primer equipo de la liga para poder inscribir jugadores."
          accion={
            rolActual === "administrador" ? (
              <Boton onClick={() => setMostrarNuevo(true)}>
                <Plus size={16} />
                Nuevo equipo
              </Boton>
            ) : undefined
          }
        />
      )}

      {categorias.map((categoria) => {
        const equiposCat = equipos.filter((e) => e.categoriaId === categoria.id);
        if (equiposCat.length === 0) return null;
        return (
          <section key={categoria.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                {categoria.nombre}
              </h2>
              <span className="text-xs text-muted">
                {equiposCat.length} / {categoria.cupoEquipos} equipos
              </span>
            </div>
            {equiposCat.map((equipo) => {
              const plantel = jugadores.filter((j) => j.equipoId === equipo.id);
              const visible = puedeVerPlantel(rolActual, equipoDelegadoId, equipo.id);
              const contenido = (
                <Tarjeta
                  className={`flex items-center justify-between gap-3 ${
                    visible ? "transition-shadow hover:shadow-md" : "opacity-80"
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-semibold text-ink">{equipo.nombre}</p>
                    <p className="text-sm text-muted">
                      Delegado: {equipo.delegado.nombre} · {equipo.delegado.telefono}
                    </p>
                    <p className="text-xs text-muted">
                      {plantel.length} / {categoria.limiteJugadoresPorPlantel} jugadores
                    </p>
                  </div>
                  {visible ? (
                    <ChevronRight className="shrink-0 text-muted" size={20} />
                  ) : (
                    <Etiqueta icono={Lock}>Plantel privado</Etiqueta>
                  )}
                </Tarjeta>
              );
              return visible ? (
                <Link
                  key={equipo.id}
                  href={`/equipos/${equipo.id}`}
                  className="block"
                  data-testid={`equipo-${equipo.id}`}
                >
                  {contenido}
                </Link>
              ) : (
                <div key={equipo.id} data-testid={`equipo-${equipo.id}`}>
                  {contenido}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
