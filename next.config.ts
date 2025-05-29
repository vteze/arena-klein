
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Domain for user-provided court images
        protocol: 'https',
        hostname: 'manalinda.cdn.magazord.com.br',
        port: '',
        pathname: '/**',
      },
      { // Domain for user-provided court images
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/**',
      }
      // Removed instagram.fpoa33-1.fna.fbcdn.net as it's not reliable for direct embedding due to CORS
    ],
  },
};

export default nextConfig;
