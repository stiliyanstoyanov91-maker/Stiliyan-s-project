import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
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
