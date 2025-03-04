/**
 * Script para probar la funcionalidad de "Mis Reservas"
 * Este script usa Playwright para automatizar la navegación y pruebas
 * 
 * Uso:
 * 1. npm install playwright
 * 2. node scripts/test-reservations.js
 */

import { chromium } from 'playwright';

// Configuración
const config = {
  baseUrl: 'http://localhost:3000', // Cambia esto si tu app corre en otro puerto
  credentials: {
    email: 'johmarket36@gmail.com',
    password: '123123123' // Reemplaza con la contraseña correcta
  },
  timeouts: {
    navigation: 5000,
    action: 1000,
    assertion: 500
  }
};

// Función principal de prueba
async function runTest() {
  console.log('🚀 Iniciando prueba de "Mis Reservas"');
  
  const browser = await chromium.launch({ headless: false }); // headless: false para ver el navegador
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Paso 1: Iniciar sesión
    console.log('👤 Iniciando sesión con', config.credentials.email);
    await page.goto(`${config.baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Llenar formulario de login
    await page.fill('input[type="email"]', config.credentials.email);
    await page.fill('input[type="password"]', config.credentials.password);
    await page.click('button[type="submit"]');
    
    // Esperar a que se complete el inicio de sesión
    await page.waitForNavigation();
    console.log('✅ Inicio de sesión exitoso');
    
    // Paso 2: Navegar a "Mis Reservas"
    console.log('🧭 Navegando a "Mis Reservas"');
    // Hacer clic en el botón del menú de usuario
    await page.click('#user-menu-button');
    await page.waitForTimeout(config.timeouts.action);
    
    // Buscar y hacer clic en el enlace de "Mis Reservas" en el menú desplegable
    const reservationsLink = await page.locator('a', { hasText: 'Mis Reservas' }).first();
    await reservationsLink.click();
    
    // Esperar a que cargue la página
    await page.waitForLoadState('networkidle');
    console.log('✅ Navegación a "Mis Reservas" exitosa');
    
    // Paso 3: Verificar si hay reservas
    console.log('🔍 Verificando reservas');
    
    // Verificar si hay reservas pendientes
    const pendingReservations = await page.locator('h2:has-text("Pendientes")').isVisible();
    
    if (pendingReservations) {
      console.log('✅ Se encontraron reservas pendientes');
      
      // Paso 4: Probar funcionalidad de cancelar reserva (opcional)
      const cancelButtons = await page.locator('.cancel-reservation-btn');
      const cancelButtonCount = await cancelButtons.count();
      
      if (cancelButtonCount > 0) {
        console.log(`🧪 Probando cancelación de reserva (encontradas: ${cancelButtonCount})`);
        
        // Configurar el manejo del diálogo de confirmación
        page.on('dialog', async dialog => {
          console.log('🔔 Confirmando diálogo: ', dialog.message());
          await dialog.accept();
        });
        
        // Hacer clic en el primer botón de cancelar
        // Comentar la siguiente línea si no quieres realmente cancelar una reserva
        // await cancelButtons.first().click();
        console.log('⚠️ La cancelación real está desactivada. Descomenta la línea para activarla.');
        
        // Esperar a que se complete la acción (si se descomenta)
        // await page.waitForResponse(response => response.url().includes('/api/reservation/cancel'));
        // console.log('✅ Reserva cancelada exitosamente');
      } else {
        console.log('ℹ️ No hay reservas pendientes para cancelar');
      }
    } else {
      console.log('ℹ️ No se encontraron reservas pendientes');
    }
    
    // Paso 5: Verificar categorías de reservas
    const categories = ['Pendientes', 'Confirmadas', 'En Progreso', 'Completadas', 'Canceladas'];
    for (const category of categories) {
      const categoryExists = await page.locator(`h2:has-text("${category}")`).isVisible();
      if (categoryExists) {
        const reservationsCount = await page.locator(`h2:has-text("${category}") + span`).textContent();
        console.log(`📊 Categoría "${category}": ${reservationsCount || 'disponible'}`);
      }
    }
    
    // Capturar una screenshot
    await page.screenshot({ path: 'mis-reservas-test.png' });
    console.log('📸 Captura de pantalla guardada como "mis-reservas-test.png"');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Captura del error guardada como "error-screenshot.png"');
  } finally {
    // Cerrar el navegador
    console.log('🏁 Finalizando prueba');
    await browser.close();
  }
}

// Ejecutar la prueba
runTest().catch(console.error); 