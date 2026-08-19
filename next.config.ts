import type { NextConfig } from "next";
import path from "node:path";

const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const basePath = configuredBasePath || undefined;
const dashboardBase = configuredBasePath || "";
const legacyBasePaths = ["/garage_dashboard", "/dahboard"].filter(
  (path) => path !== dashboardBase
);
const externalRedirect = {
  basePath: false as const,
  permanent: false,
};

const securityHeaders = [
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  ...(basePath ? { basePath } : {}),
  experimental: {
    externalDir: true,
    proxyClientMaxBodySize: "12mb",
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: `${dashboardBase}/dashboard`,
        ...externalRedirect,
      },
      ...legacyBasePaths.flatMap((legacyPath) => [
        {
          source: legacyPath,
          destination: `${dashboardBase}/dashboard`,
          ...externalRedirect,
        },
        {
          source: `${legacyPath}/:path*`,
          destination: `${dashboardBase}/:path*`,
          ...externalRedirect,
        },
      ]),
    ];
  },
};

export default nextConfig;
