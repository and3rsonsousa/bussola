import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import { vercelPreset } from "@vercel/remix/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

installGlobals();

export default defineConfig({
  plugins: [
    remix({ presets: [vercelPreset()], future: { v3_singleFetch: true } }),
    tsconfigPaths(),
    tailwindcss(),
  ],
  server: {
    host: true,
  },
  ssr: {
    noExternal: ["tailwind-merge"],
  },
});
