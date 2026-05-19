/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    browserDebugInfoInTerminal: true,
  },
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  devIndicators: false,
  allowedDevOrigins: [
    "*.macaly.dev",
    "*.macaly.app",
    "*.macaly-app.com",
    "*.macaly-user-data.dev",
  ],
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        condition: {
          all: [{ not: "foreign" }, "development"],
        },
        loaders: [
          {
            loader: "macaly-tagger",
            options: {
              disableSourceMaps: true,
              ignorePackages: [
                // Skip components imported from these packages (requires macaly-tagger v1.2.0+)
                "@react-three/fiber",
                "@react-three/drei",
              ],
            },
          },
        ],
        as: "*",
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.module.rules.unshift({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "macaly-tagger",
            options: {
              ignorePackages: [
                // Skip components imported from these packages (requires macaly-tagger v1.2.0+)
                "@react-three/fiber",
                "@react-three/drei",
              ],
            },
          },
        ],
        enforce: "pre",
      });
    }

    return config;
  },
};

module.exports = nextConfig;
