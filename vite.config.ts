// @lovable.dev/vite-tanstack-config already includes the framework plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

const env = loadEnv(process.env["NODE_ENV"] === "production" ? "production" : "development", process.cwd(), "");
for (const key of ["OPENAI_API_KEY", "MP_ACCESS_TOKEN", "MERCADOPAGO_ACCESS_TOKEN", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"]) {
  if (env[key] && !process.env[key]) process.env[key] = env[key];
}

// Supabase's public client reads VITE_* values in the browser. Vercel currently
// stores the equivalent server names, so expose only these two public values at
// build time; never expose the service-role key.
const publicSupabaseEnv = {
  VITE_SUPABASE_URL: process.env["VITE_SUPABASE_URL"] || env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || env["SUPABASE_URL"],
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"] || env["SUPABASE_PUBLISHABLE_KEY"],
};
for (const [key, value] of Object.entries(publicSupabaseEnv)) {
  if (value) process.env[key] = value;
}

export default defineConfig({
  nitro: { preset: "vercel" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
