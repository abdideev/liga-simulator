"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Users } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";

export default function EquiposPage() {
  const { estado, crearEquipo } = useSimulador();
  const { categorias, equipos, jugadores, rolActual } = estado;
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [delegadoNombre, setDelegadoNombre] = useState("");
  const [delegadoTelefono, setDelegadoTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !categoriaId || !delegadoNombre.trim() || !delegadoTelefono.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }
    const categoria = categorias.find((c) => c.id === categoriaId);
    const equiposEnCategoria = equipos.filter((e) => e.categoriaId === categoriaId).length;
    if (categoria && equiposEnCategoria >= categoria.cupoEquipos) {
      setError(`La categoría ${categoria.nombre} ya alcanzó su cupo de ${categoria.cupoEquipos} equipos`);
      return;
    }
    crearEquipo({
      nombre: nombre.trim(),
      categoriaId,
      delegado: { nombre: delegadoNombre.trim(), telefono: delegadoTelefono.trim() },
    });
    setNombre("");
    setDelegadoNombre("");
    setDelegadoTelefono("");
    setError(null);
    setMostrarNuevo(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Users className="text-(--color-primary)" size={22} />
            Equipos
          </h1>
          <p className="text-sm text-gray-600">
            {equipos.length} equipo(s) registrados en {categorias.length} categoría(s)
          </p>
        </div>
        {rolActual === "administrador" && !mostrarNuevo && (
          <Boton onClick={() => setMostrarNuevo(true)}>
            <Plus size={16} />
            Nuevo equipo
          </Boton>
        )}
      </div>

      {mostrarNuevo && (
        <Tarjeta>
          <h2 className="mb-3 font-semibold text-gray-900">Registrar equipo</h2>
          <form onSubmit={manejarEnvio} className="space-y-3">
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
            <div className="grid grid-cols-2 gap-3">
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
            {error && <p className="text-sm font-medium text-(--color-danger)">{error}</p>}
            <div className="flex gap-2">
              <Boton type="submit">Registrar equipo</Boton>
              <Boton type="button" variante="secundario" onClick={() => setMostrarNuevo(false)}>
                Cancelar
              </Boton>
            </div>
          </form>
        </Tarjeta>
      )}

      {equipos.length === 0 && !mostrarNuevo && (
        <EstadoVacio
          icono={Users}
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
          <div key={categoria.id}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {categoria.nombre}
            </h2>
            <div className="space-y-2">
              {equiposCat.map((equipo) => {
                const plantel = jugadores.filter((j) => j.equipoId === equipo.id);
                return (
                  <Link key={equipo.id} href={`/equipos/${equipo.id}`}>
                    <Tarjeta className="flex items-center justify-between transition-colors hover:border-(--color-primary)">
                      <div>
                        <p className="font-semibold text-gray-900">{equipo.nombre}</p>
                        <p className="text-sm text-gray-600">
                          Delegado: {equipo.delegado.nombre} · {equipo.delegado.telefono}
                        </p>
                        <p className="text-xs text-gray-500">
                          {plantel.length} / {categoria.limiteJugadoresPorPlantel} jugadores
                        </p>
                      </div>
                      <ChevronRight className="shrink-0 text-gray-400" size={20} />
                    </Tarjeta>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
