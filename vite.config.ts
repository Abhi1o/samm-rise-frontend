import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller, faster bundles (better Core Web Vitals)
    target: "es2020",
    // Minification
    minify: "esbuild" as const,
    cssMinify: true,
    // Disable source maps in production for faster load
    sourcemap: false,
    // Warn on large chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking: split heavy vendor libs so the main bundle stays small
        // This dramatically improves LCP (Largest Contentful Paint)
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-wagmi": ["wagmi", "viem"],
          "vendor-rainbow": ["@rainbow-me/rainbowkit"],
          "vendor-query": ["@tanstack/react-query"],
        },
      },
    },
    // Remove console logs in production build
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for our custom branding
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
    },
  },
  esbuild: {
    // Remove console logs during development build (optional)
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
  },
}));
