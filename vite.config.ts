// @lovable.dev/vite-tanstack-config already includes the framework plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const env = loadEnv(process.env.NODE_ENV === "production" ? "production" : "development", process.cwd(), "");
for (const key of ["OPENAI_API_KEY", "MP_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"]) {
  if (env[key] && !process.env[key]) process.env[key] = env[key];
}

export default defineConfig({
  nitro: { preset: "vercel" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});

