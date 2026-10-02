import react from '@vitejs/plugin-react';
import {defineConfig} from 'vitest/config';

// Kept apart from vite.config.ts, which AI Studio manages.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
