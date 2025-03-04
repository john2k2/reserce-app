// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  
  // Configuración de optimización y caché
  build: {
    // Activar minificación para HTML, CSS y JS
    inlineStylesheets: 'auto',
  },
  
  // Configuración de caché para el servidor
  server: {
    headers: {
      // Configuración de Cache-Control para diferentes tipos de archivos
      '*.js': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '*.css': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '*.svg': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '*.jpg': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '*.png': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '*.woff2': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    }
  },
  
  // Configuración de compresión para reducir el tamaño de transferencia
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