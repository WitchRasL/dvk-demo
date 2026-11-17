import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.{js,mjs}', 'tests/**/*.test.{js,jsx}'],
      css: false,
      // Vitest сам ставит base '/', поэтому BASE_URL задаём явно — тесты видят тот же адрес, что и сборка.
      env: { BASE_URL: viteConfig.base },
    },
  }),
);
