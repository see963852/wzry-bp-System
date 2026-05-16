/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'game.gtimg.cn' },
      { protocol: 'https', hostname: 'ossweb-img.qq.com' },
      { protocol: 'https', hostname: 'pvp.qq.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
};

export default nextConfig;
