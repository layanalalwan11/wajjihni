/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;
let assetPrefix = '';
let basePath = '';

if (isGithubActions) {
  const repo = (process.env.GITHUB_REPOSITORY || '').replace(/.*?\//, '') || 'wajjihni';
  assetPrefix = `/${repo}/`;
  basePath = `/${repo}`;
}

const nextConfig = {
  output: 'export',
  assetPrefix: assetPrefix || undefined,
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
