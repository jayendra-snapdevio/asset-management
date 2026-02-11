import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Custom plugin to fix CSRF header mismatch in dev tunnels for React Router Single Fetch
const devTunnelProxyFix = (): Plugin => ({
  name: "dev-tunnel-proxy-fix",
  configureServer(server) {
    server.middlewares.use((req, _, next) => {
      const origin = req.headers["origin"];
      if (origin && typeof origin === "string") {
        try {
          const originUrl = new URL(origin);
          // Ensure x-forwarded-host matches the origin's host to pass RR's CSRF check
          req.headers["x-forwarded-host"] = originUrl.host;
          // Also set protocol if it's HTTPS
          if (originUrl.protocol === "https:") {
            req.headers["x-forwarded-proto"] = "https";
          }
        } catch {
          // Ignore invalid origin URLs
        }
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [devTunnelProxyFix(), tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    allowedHosts: true,
  },
});
