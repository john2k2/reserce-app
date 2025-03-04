// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [tailwind()],
  
  // Configuración de optimización y caché
  build: {
    // Activar minificación para HTML, CSS y JS
    inlineStylesheets: 'auto',
  },
  
  // Vite configuration
  vite: {
    build: {
      // Dividir código en chunks más pequeños
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Estrategia de división de código por tipo
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Separar dependencias de terceros en chunks diferentes
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          }
        }
      }
    },
    // Habilitar optimización para producción
    optimizeDeps: {
      include: ['tailwindcss']
    }
  }
});