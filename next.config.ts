import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/data-center",
        destination: "/calendar",
        permanent: true,
      },
    ]
  },
}

export default nextConfig;
