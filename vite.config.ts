import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { roomApiPlugin } from './vite-plugins/roomApi';

export default defineConfig({
  plugins: [react(), tailwindcss(), roomApiPlugin()],
});
