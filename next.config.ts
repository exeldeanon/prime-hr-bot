import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve bundled assets directly. The self-hosted Vinext runtime does not
    // provide a production image optimizer for `/_next/image`.
    unoptimized: true,
  },
};

export default nextConfig;
