import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Crear la instancia de Pinia
const pinia = createPinia();

// Exportar una función que configure la app de Vue
export default (app: any) => {
  app.use(pinia);
}; 