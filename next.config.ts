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
  experimental: {
    // Valida a navegação instantânea só onde houver `export const instant` explícito.
    instantInsights: { validationLevel: "manual-warning" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
