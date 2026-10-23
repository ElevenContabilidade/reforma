import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Dois apps no mesmo projeto: o simulador da reforma (index.html) e a gestão de MEI (mei.html).
      input: { main: 'index.html', mei: 'mei.html' },
    },
  },
})
