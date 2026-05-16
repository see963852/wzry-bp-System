/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'game.gtimg.cn' },
      { protocol: 'https', hostname: 'pvp.qq.com' },
      { protocol: 'https', hostname: 'ossweb-img.qq.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['cheerio'],
  },
};

export default nextConfig;
