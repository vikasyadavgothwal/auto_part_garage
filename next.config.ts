import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/user_dashboard";
const legacyBasePaths = ["/dashboard", "/dahboard"].filter(
  (path) => path !== basePath
);
const externalRedirect = {
  basePath: false as const,
  permanent: false,
};

const nextConfig: NextConfig = {
  basePath,
  async redirects() {
    return [
      {
        source: "/",
        destination: basePath,
        ...externalRedirect,
      },
      ...legacyBasePaths.flatMap((legacyPath) => [
        {
          source: legacyPath,
          destination: basePath,
          ...externalRedirect,
        },
        {
          source: `${legacyPath}/:path*`,
          destination: `${basePath}/:path*`,
          ...externalRedirect,
        },
      ]),
    ];
  },
};

export default nextConfig;
