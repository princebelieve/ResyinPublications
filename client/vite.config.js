// client/vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const verification = env.VITE_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    plugins: [
      react(),
      {
        name: "google-site-verification",
        transformIndexHtml() {
          if (!verification || verification === "your_google_search_console_token") return [];
          return [{
            tag: "meta",
            attrs: { name: "google-site-verification", content: verification },
            injectTo: "head",
          }];
        },
      },
    ],
  };
});
