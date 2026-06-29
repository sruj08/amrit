import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// LRIP frontend — fully local, no backend, data imported as TS modules.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
});
