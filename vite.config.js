import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base — адрес репозитория на GitHub Pages: https://witchrasl.github.io/dvk-demo/ (репозиторий WitchRasL/dvk-demo)
export default defineConfig({
  base: '/dvk-demo/',
  plugins: [react(), tailwindcss()],
});
