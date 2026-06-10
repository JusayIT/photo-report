import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Если sw.js остается в public, убедимся, что папка копируется
  publicDir: 'public', 
  build: {
    outDir: 'dist',
    // Включаем копирование всех скрытых/важных файлов
    copyPublicDir: true 
  }
  import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true // Чтобы Vite открывал доступ для устройств в сети
  }
});
});