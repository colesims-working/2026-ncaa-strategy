import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/state": "http://localhost:3001",
      "/pick": "http://localhost:3001",
      "/unpick": "http://localhost:3001",
      "/settings": "http://localhost:3001",
      "/health": "http://localhost:3001",
      "/events": "http://localhost:3001",
    },
  },
});
