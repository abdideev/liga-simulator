"use client";

import { useState } from "react";
import { FileText, ShieldCheck, UserPlus } from "lucide-react";

import { useSimulador } from "@/context/SimuladorContext";
import Aviso from "@/components/ui/Aviso";
import Boton from "@/components/ui/Boton";
import Campo, { claseCampo } from "@/components/ui/Campo";
import Tarjeta from "@/components/ui/Tarjeta";
import {
  AVISO_PRIVACIDAD,
  AVISO_SIMPLIFICADO,
  CASILLAS,
  TERMINOS_USO,
  textoCanonico,
} from "@/lib/legal/documentos";
import { describirDispositivo, huellaCorta, useHuella } from "@/lib/legal/huella";
import type { UsuarioSimulado } from "@/lib/types";

import VistaDocumento from "./DocumentoLegal";
import Modal from "./Modal";

/**
 * First sign-in of a user (Capa 3). Before entering, the user sees the
 * simplified privacy notice and accepts the Términos de uso with unchecked
 * boxes; the acceptance stores the version and SHA-256 of both texts.
 */
export default function RegistroInicial({ usuario }: { usuario: UsuarioSimulado }) {
  const { estado, despachar } = useSimulador();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [correo, setCorreo] = useState(usuario.correo);
  const [contrasena, setContrasena] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [leyoAviso, setLeyoAviso] = useState(false);
  const [modal, setModal] = useState<"aviso" | "terminos" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const huellaTerminos = useHuella(textoCanonico(TERMINOS_USO));
  const huellaAviso = useHuella(textoCanonico(AVISO_PRIVACIDAD));
  const listo = aceptaTerminos && leyoAviso && contrasena.length >= 8 && !!huellaTerminos && !!huellaAviso;

  function crearCuenta(e: React.FormEvent) {
    e.preventDefault();
    const resultado = despachar({
      tipo: "aceptarTerminos",
      aceptacion: {
        usuario: usuario.clave,
        nombre,
        correo,
        rol: usuario.rol,
        versionTerminos: TERMINOS_USO.version,
        huellaTerminos,
        versionAviso: AVISO_PRIVACIDAD.version,
        huellaAviso,
        casillas: [aceptaTerminos && CASILLAS.terminos, leyoAviso && CASILLAS.avisoLeido].filter(
          (c): c is string => !!c
        ),
        dispositivo: describirDispositivo(),
      },
    });
    if (!resultado.ok) setError(resultado.motivo ?? "No se pudo crear la cuenta");
  }

  return (
    <div className="mx-auto max-w-xl" data-testid="registro-inicial">
      <Tarjeta className="space-y-5">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
            <UserPlus size={22} />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-ink">Crea tu cuenta</h1>
            <p className="text-sm text-muted">
              Primer acceso · {usuario.cargo} · {estado.liga.nombre}
            </p>
          </div>
        </div>

        <form onSubmit={crearCuenta} className="space-y-4">
          <Campo etiqueta="Nombre completo">
            <input className={claseCampo} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </Campo>
          <Campo etiqueta="Correo electrónico" ayuda="Aquí recibirás avisos y códigos de verificación">
            <input
              type="email"
              className={claseCampo}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Contraseña" ayuda="Mínimo 8 caracteres. Se guarda como huella (hash), nunca en texto plano.">
            <input
              type="password"
              className={claseCampo}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              data-testid="campo-contrasena"
              autoComplete="new-password"
            />
          </Campo>

          <div className="space-y-2 rounded-2xl bg-accent-soft p-4 text-sm text-accent-ink" data-testid="aviso-simplificado">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck size={16} /> Aviso de privacidad
            </p>
            <p className="leading-relaxed">{AVISO_SIMPLIFICADO.secciones[0].parrafos![0]}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-medium">
              <button type="button" className="min-h-0 underline underline-offset-2" onClick={() => setModal("aviso")}>
                Leer aviso integral
              </button>
              <button type="button" className="min-h-0 underline underline-offset-2" onClick={() => setModal("terminos")}>
                Leer Términos de uso
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                data-testid="casilla-terminos"
                className="mt-0.5"
              />
              <span>
                {CASILLAS.terminos} <span className="text-danger-ink">*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={leyoAviso}
                onChange={(e) => setLeyoAviso(e.target.checked)}
                data-testid="casilla-aviso"
                className="mt-0.5"
              />
              <span>
                {CASILLAS.avisoLeido} <span className="text-danger-ink">*</span>
              </span>
            </label>
            <p className="text-xs text-muted">
              Las casillas llegan vacías. Al aceptar se registran la versión y la huella de cada texto,
              la fecha y hora y tu dispositivo.
            </p>
          </div>

          <div className="space-y-1 rounded-2xl bg-canvas px-4 py-3 text-xs text-muted" data-testid="huellas-registro">
            <p className="flex items-center gap-1.5">
              <FileText size={13} /> Términos de uso v{TERMINOS_USO.version} · huella{" "}
              <code className="font-mono text-ink">{huellaCorta(huellaTerminos)}</code>
            </p>
            <p className="flex items-center gap-1.5">
              <FileText size={13} /> Aviso de privacidad v{AVISO_PRIVACIDAD.version} · huella{" "}
              <code className="font-mono text-ink">{huellaCorta(huellaAviso)}</code>
            </p>
          </div>

          {error && <Aviso intencion="danger">{error}</Aviso>}

          <Boton type="submit" disabled={!listo} className="w-full" data-testid="boton-crear-cuenta">
            Crear cuenta y entrar
          </Boton>
        </form>
      </Tarjeta>

      <Modal abierto={modal === "aviso"} onCerrar={() => setModal(null)} titulo="Aviso de privacidad integral">
        <VistaDocumento doc={AVISO_PRIVACIDAD} />
      </Modal>
      <Modal abierto={modal === "terminos"} onCerrar={() => setModal(null)} titulo="Términos de uso">
        <VistaDocumento doc={TERMINOS_USO} />
      </Modal>
    </div>
  );
}
