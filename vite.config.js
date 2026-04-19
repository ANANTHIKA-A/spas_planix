import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        calendar: resolve(__dirname, 'calendar.html'),
        analysis: resolve(__dirname, 'analysis.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        planner: resolve(__dirname, 'planner.html'),
        search: resolve(__dirname, 'search.html'),
        navigation_map: resolve(__dirname, 'navigation_map.html'),
        focus: resolve(__dirname, 'focus.html'),
        profile: resolve(__dirname, 'profile.html')
      },
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      }
    },
  },
});
