import { resolve } from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    Vue(),
  ],
  resolve: {
    alias: {
      'vue-imitate-input': resolve(__dirname, '../src/index.ts'),
    },
  },
})
