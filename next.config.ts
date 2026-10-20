import type { NextConfig } from "next";

// Headers básicos aplicados a todas as rotas. A Content Security Policy completa entra na Fase 8 (SPEC §19).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  // Build mais leve para servidores com pouca memória (docs: guides/memory-usage).
  enablePrerenderSourceMaps: false,
  experimental: {
    // Valida a navegação instantânea só onde houver `export const instant` explícito.
    instantInsights: { validationLevel: "manual-warning" },
    serverSourceMaps: false,
    // No Docker, NEXT_BUILD_CPUS=1 gera as páginas com um processo só (cada processo extra custa memória).
    cpus: process.env.NEXT_BUILD_CPUS ? Number(process.env.NEXT_BUILD_CPUS) : undefined,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
