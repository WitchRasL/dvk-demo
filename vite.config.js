import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base — адрес репозитория на GitHub Pages: https://<owner>.github.io/dvk-style-redesign/
export default defineConfig({
  base: '/dvk-style-redesign/',
  plugins: [react(), tailwindcss()],
});
