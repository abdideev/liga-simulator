import {
  BarChart3,
  Calendar,
  Eye,
  Flag,
  Home,
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
} satisfies Record<string, LucideIcon>;
