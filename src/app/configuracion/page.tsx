"use client";

import { useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import EstadoVacio from "@/components/ui/EstadoVacio";
import EncabezadoPagina from "@/components/ui/EncabezadoPagina";
import { ICONO_SECCION } from "@/components/iconosSeccion";
import FormularioCategoria, {
  type DatosCategoria,
} from "@/components/configuracion/FormularioCategoria";

export default function ConfiguracionPage() {
  const { estado, despachar } = useSimulador();
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
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [categoriaEditando, setCategoriaEditando] = useState<string | null>(null);
  const [mostrarNueva, setMostrarNueva] = useState(false);

  function guardarDatosGenerales(e: React.FormEvent) {
    e.preventDefault();
    const resultado = despachar({
      tipo: "actualizarConfiguracionLiga",
      nombreLiga,
      nombreTemporada,
    });
    if (!resultado.ok) {
      setErrorGeneral(resultado.motivo ?? "No se pudo guardar");
      return;
    }
    setErrorGeneral(null);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  function guardarNuevaCategoria(datos: DatosCategoria) {
    const resultado = despachar({ tipo: "crearCategoria", datos });
    if (resultado.ok) setMostrarNueva(false);
    return resultado;
  }

  function guardarCategoriaExistente(categoriaId: string, datos: DatosCategoria) {
    const resultado = despachar({ tipo: "actualizarCategoria", categoriaId, datos });
    if (resultado.ok) setCategoriaEditando(null);
    return resultado;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EncabezadoPagina
        icono={ICONO_SECCION.configuracion}
        titulo="Configuración de liga"
        descripcion="Define el nombre de la liga, la temporada activa y las categorías disponibles."
      />

      <Tarjeta>
        <h2 className="mb-4 font-semibold text-ink">Datos generales</h2>
        <form onSubmit={guardarDatosGenerales} className="space-y-4">
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
          {errorGeneral && <p className="text-sm font-medium text-danger-ink">{errorGeneral}</p>}
          <div className="flex items-center gap-3">
            <Boton type="submit">Guardar</Boton>
            {guardado && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ok-ink">
                <CheckCircle2 size={16} />
                Cambios guardados
              </span>
            )}
          </div>
        </form>
      </Tarjeta>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink">Categorías</h2>
          {!mostrarNueva && (
            <Boton variante="suave" onClick={() => setMostrarNueva(true)}>
              <Plus size={16} />
              Nueva categoría
            </Boton>
          )}
        </div>

        {mostrarNueva && (
          <Tarjeta>
            <h3 className="mb-4 font-semibold text-ink">Nueva categoría</h3>
            <FormularioCategoria
              onGuardar={guardarNuevaCategoria}
              onCancelar={() => setMostrarNueva(false)}
            />
          </Tarjeta>
        )}

        {estado.categorias.length === 0 && !mostrarNueva && (
          <EstadoVacio
            icono={ICONO_SECCION.configuracion}
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
              <h3 className="mb-4 font-semibold text-ink">Editar {cat.nombre}</h3>
              <FormularioCategoria
                valorInicial={cat}
                onGuardar={(datos) => guardarCategoriaExistente(cat.id, datos)}
                onCancelar={() => setCategoriaEditando(null)}
              />
            </Tarjeta>
          ) : (
            <Tarjeta key={cat.id} className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-semibold text-ink">{cat.nombre}</p>
                <p className="text-sm text-muted">
                  Nacidos entre {cat.anioNacimientoMin} y {cat.anioNacimientoMax}
                </p>
                <p className="text-sm text-muted">
                  Cupo: {cat.cupoEquipos} equipos · Límite de plantel:{" "}
                  {cat.limiteJugadoresPorPlantel} jugadores
                </p>
                <Etiqueta intencion={cat.registroCerrado ? "neutral" : "ok"} className="mt-1">
                  {cat.registroCerrado
                    ? `Registro cerrado el ${cat.fechaCierreRegistro}`
                    : "Registro abierto"}
                </Etiqueta>
              </div>
              <Boton
                intencion="neutral"
                variante="contorno"
                onClick={() => setCategoriaEditando(cat.id)}
                data-testid={`boton-editar-categoria-${cat.id}`}
              >
                Editar
              </Boton>
            </Tarjeta>
          )
        )}
      </section>
    </div>
  );
}
