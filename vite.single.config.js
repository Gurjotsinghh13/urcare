import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds one self-contained HTML file: dist-single/index.html
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'dist-single' },
});
