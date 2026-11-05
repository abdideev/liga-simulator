import {
  BarChart3,
  Calendar,
  Eye,
  Flag,
  FilePen,
  Home,
  ShieldCheck,
  UserCog,
  Lock,
  ScrollText,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

/** One fixed icon per section, shared by the menu and each page header. */
export const ICONO_SECCION = {
  inicio: Home,
  configuracion: SlidersHorizontal,
  equipos: Users,
  registro: Lock,
  calendario: Calendar,
  partidos: Flag,
  estadisticas: BarChart3,
  publico: Eye,
  bitacora: ScrollText,
  privacidad: ShieldCheck,
  cuenta: UserCog,
  licencia: FilePen,
} satisfies Record<string, LucideIcon>;
