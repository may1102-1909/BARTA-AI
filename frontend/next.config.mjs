/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/simulator/start',
        destination: '/api/simulator/start',
      },
      {
        source: '/simulator/turn',
        destination: '/api/simulator/turn',
      },
      {
        source: '/simulator/parse-csv',
        destination: '/api/simulator/parse-csv',
      },
    ];
  },
};

export default nextConfig;
