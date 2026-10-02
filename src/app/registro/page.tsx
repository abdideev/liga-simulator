"use client";

import { useState } from "react";
import { CheckCircle2, Lock, LockOpen } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CierreRegistroPage() {
  const { estado, cerrarRegistroCategoria } = useSimulador();
  const { categorias, equipos, jugadores } = estado;
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [fecha, setFecha] = useState(fechaHoy());

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
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Lock className="text-(--color-primary)" size={22} />
          Cierre de registro
        </h1>
        <p className="text-sm text-gray-600">
          Congela los planteles de una categoría en una fecha determinada. Después del cierre,
          los planteles quedan de solo lectura y ya no se pueden inscribir nuevos jugadores.
        </p>
      </div>

      <div className="space-y-3">
        {categorias.map((categoria) => {
          const equiposCat = equipos.filter((e) => e.categoriaId === categoria.id);
          const jugadoresCat = jugadores.filter((j) =>
            equiposCat.some((e) => e.id === j.equipoId)
          );
          const formularioAbierto = categoriaActiva === categoria.id;

          return (
            <Tarjeta key={categoria.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{categoria.nombre}</p>
                  <p className="text-sm text-gray-600">
                    {equiposCat.length} equipos · {jugadoresCat.length} jugadores inscritos
                  </p>
                </div>
                {categoria.registroCerrado ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-(--color-primary-light) px-3 py-1.5 text-xs font-semibold text-(--color-primary-dark)">
                    <CheckCircle2 size={14} />
                    Cerrado
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                    <LockOpen size={14} />
                    Abierto
                  </span>
                )}
              </div>

              {categoria.registroCerrado ? (
                <p className="mt-2 text-xs font-medium text-gray-500">
                  Registro congelado el {categoria.fechaCierreRegistro}
                </p>
              ) : formularioAbierto ? (
                <div className="mt-3 space-y-3 border-t border-(--color-border) pt-3">
                  <Campo etiqueta="Fecha de cierre">
                    <input
                      type="date"
                      className={claseCampo}
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </Campo>
                  <p className="text-xs text-gray-500">
                    Esta acción congelará el plantel de {equiposCat.length} equipo(s). No podrás
                    inscribir más jugadores en {categoria.nombre} después de confirmar.
                  </p>
                  <div className="flex gap-2">
                    <Boton
                      variante="peligro"
                      onClick={() => {
                        cerrarRegistroCategoria(categoria.id, fecha);
                        setCategoriaActiva(null);
                      }}
                    >
                      Confirmar cierre de registro
                    </Boton>
                    <Boton variante="secundario" onClick={() => setCategoriaActiva(null)}>
                      Cancelar
                    </Boton>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setCategoriaActiva(categoria.id);
                      setFecha(fechaHoy());
                    }}
                  >
                    <Lock size={16} />
                    Cerrar registro
                  </Boton>
                </div>
              )}
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
