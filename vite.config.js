import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true // Позволяет подключаться к локальному серверу с телефона по Wi-Fi
  }
});