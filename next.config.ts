import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const pagesBasePath = "/virtual-cat";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  ...(githubPages
    ? {
        output: "export",
        basePath: pagesBasePath,
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
