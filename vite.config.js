import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-hook-form': path.resolve(__dirname, 'src/vendor/react-hook-form.tsx'),
      '@hookform/resolvers/zod': path.resolve(__dirname, 'src/vendor/hookform-resolvers-zod.ts'),
      zod: path.resolve(__dirname, 'src/vendor/zod.js'),
    },
  },
})
