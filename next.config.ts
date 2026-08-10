import type { NextConfig } from "next";

const githubRepository = process.env.GITHUB_REPOSITORY ?? "";
const [githubOwner = "", githubRepositoryName = ""] = githubRepository.split("/");
const isUserOrOrganizationPage =
  githubRepositoryName.toLowerCase() === `${githubOwner.toLowerCase()}.github.io`;
const githubBasePath =
  process.env.GITHUB_PAGES === "true" && githubRepositoryName && !isUserOrOrganizationPage
    ? `/${githubRepositoryName}`
    : "";

const nextConfig: NextConfig = {
  ...(process.env.GITHUB_PAGES === "true"
    ? {
        output: "export",
        basePath: githubBasePath,
        assetPrefix: githubBasePath || undefined,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: githubBasePath,
  },
};

export default nextConfig;
