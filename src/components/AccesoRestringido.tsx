"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";

import Boton from "@/components/ui/Boton";
import EstadoVacio from "@/components/ui/EstadoVacio";

export default function AccesoRestringido({
  descripcion = "Tu rol actual no tiene acceso a esta sección. Cambia de rol en la barra superior si necesitas consultarla.",
}: {
  descripcion?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl" data-testid="acceso-restringido">
      <EstadoVacio
        icono={ShieldOff}
        titulo="Acceso restringido"
        descripcion={descripcion}
        accion={
          <Link href="/">
            <Boton variante="suave">Volver al inicio</Boton>
          </Link>
        }
      />
    </div>
  );
}
