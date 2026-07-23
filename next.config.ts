import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
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
