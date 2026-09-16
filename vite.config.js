import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Falls dein Repository anders heißt, passe den Namen hier an.
  base: "/karten-gedaechtnistrainer/",
});
