import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  // Source: https://markaicode.com/vite-6-build-optimization-guide/
  // Enable build optimizations
  build: {
    // Reduce bundle size with modern output
    target: 'esnext',
    // Enable minification for production
    minify: 'esbuild',
    // Generate source maps for debugging
    sourcemap: true,
  },
  // Optimize development server
  server: {
    // Enable fast refresh
    hmr: true,
    // Use native file watching
    watch: {
      usePolling: false
    }
  }
});
