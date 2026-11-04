import type { NextConfig } from "next";

// Security headers (Entregable 9, DEF-04). The CSP is intentionally partial:
// it blocks framing, plugins and foreign form targets without restricting
// scripts. A script-src policy with per-request nonces needs dynamic
// rendering and stays as tracked technical debt.
const ENCABEZADOS_SEGURIDAD = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: ENCABEZADOS_SEGURIDAD }];
  },
};

export default nextConfig;
