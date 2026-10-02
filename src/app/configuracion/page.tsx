"use client";

import { useState } from "react";
import { Plus, Settings } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import FormularioCategoria, {
  type DatosCategoria,
} from "@/components/configuracion/FormularioCategoria";

export default function ConfiguracionPage() {
  const { estado, actualizarConfiguracionLiga, crearCategoria, actualizarCategoria } =
    useSimulador();
  const temporadaActiva = estado.temporadas.find((t) => t.id === estado.liga.temporadaActivaId);

  // Local drafts track the source values so external changes (e.g. "Reiniciar
  // simulación") are reflected without fighting in-progress typing — adjusted
  // during render rather than via a setState-in-effect.
  const [nombreLigaFuente, setNombreLigaFuente] = useState(estado.liga.nombre);
  const [nombreLiga, setNombreLiga] = useState(estado.liga.nombre);
  if (estado.liga.nombre !== nombreLigaFuente) {
    setNombreLigaFuente(estado.liga.nombre);
    setNombreLiga(estado.liga.nombre);
  }

  const [nombreTemporadaFuente, setNombreTemporadaFuente] = useState(temporadaActiva?.nombre ?? "");
  const [nombreTemporada, setNombreTemporada] = useState(temporadaActiva?.nombre ?? "");
  if ((temporadaActiva?.nombre ?? "") !== nombreTemporadaFuente) {
    setNombreTemporadaFuente(temporadaActiva?.nombre ?? "");
    setNombreTemporada(temporadaActiva?.nombre ?? "");
  }

  const [guardado, setGuardado] = useState(false);

  const [categoriaEditando, setCategoriaEditando] = useState<string | null>(null);
  const [mostrarNueva, setMostrarNueva] = useState(false);

  function guardarDatosGenerales(e: React.FormEvent) {
    e.preventDefault();
    actualizarConfiguracionLiga(nombreLiga.trim(), nombreTemporada.trim());
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  function guardarNuevaCategoria(datos: DatosCategoria) {
    crearCategoria(datos);
    setMostrarNueva(false);
  }

  function guardarCategoriaExistente(categoriaId: string, datos: DatosCategoria) {
    actualizarCategoria(categoriaId, datos);
    setCategoriaEditando(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Settings className="text-(--color-primary)" size={22} />
          Configuración de liga
        </h1>
        <p className="text-sm text-gray-600">
          Define el nombre de la liga, la temporada activa y las categorías disponibles.
        </p>
      </div>

      <Tarjeta>
        <h2 className="mb-3 font-semibold text-gray-900">Datos generales</h2>
        <form onSubmit={guardarDatosGenerales} className="space-y-3">
          <Campo etiqueta="Nombre de la liga">
            <input
              className={claseCampo}
              value={nombreLiga}
              onChange={(e) => setNombreLiga(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Temporada / torneo">
            <input
              className={claseCampo}
              value={nombreTemporada}
              onChange={(e) => setNombreTemporada(e.target.value)}
            />
          </Campo>
          <div className="flex items-center gap-3">
            <Boton type="submit">Guardar</Boton>
            {guardado && (
              <span className="text-sm font-medium text-(--color-primary-dark)">
                Cambios guardados
              </span>
            )}
          </div>
        </form>
      </Tarjeta>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Categorías</h2>
          {!mostrarNueva && (
            <Boton variante="secundario" onClick={() => setMostrarNueva(true)}>
              <Plus size={16} />
              Nueva categoría
            </Boton>
          )}
        </div>

        <div className="space-y-3">
          {mostrarNueva && (
            <Tarjeta>
              <h3 className="mb-3 font-semibold text-gray-900">Nueva categoría</h3>
              <FormularioCategoria
                onGuardar={guardarNuevaCategoria}
                onCancelar={() => setMostrarNueva(false)}
              />
            </Tarjeta>
          )}

          {estado.categorias.length === 0 && !mostrarNueva && (
            <EstadoVacio
              icono={Settings}
              titulo="Todavía no hay categorías"
              descripcion="Crea al menos una categoría (por ejemplo, Libre o Juvenil Sub-17) para poder registrar equipos y jugadores."
              accion={
                <Boton onClick={() => setMostrarNueva(true)}>
                  <Plus size={16} />
                  Nueva categoría
                </Boton>
              }
            />
          )}

          {estado.categorias.map((cat) =>
            categoriaEditando === cat.id ? (
              <Tarjeta key={cat.id}>
                <h3 className="mb-3 font-semibold text-gray-900">Editar {cat.nombre}</h3>
                <FormularioCategoria
                  valorInicial={cat}
                  onGuardar={(datos) => guardarCategoriaExistente(cat.id, datos)}
                  onCancelar={() => setCategoriaEditando(null)}
                />
              </Tarjeta>
            ) : (
              <Tarjeta key={cat.id} className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{cat.nombre}</p>
                  <p className="text-sm text-gray-600">
                    Nacidos entre {cat.anioNacimientoMin} y {cat.anioNacimientoMax}
                  </p>
                  <p className="text-sm text-gray-600">
                    Cupo: {cat.cupoEquipos} equipos · Límite de plantel:{" "}
                    {cat.limiteJugadoresPorPlantel} jugadores
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    {cat.registroCerrado
                      ? `Registro cerrado el ${cat.fechaCierreRegistro}`
                      : "Registro abierto"}
                  </p>
                </div>
                <Boton variante="secundario" onClick={() => setCategoriaEditando(cat.id)}>
                  Editar
                </Boton>
              </Tarjeta>
            )
          )}
        </div>
      </div>
    </div>
  );
}
