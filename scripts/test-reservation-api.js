/**
 * Script para probar la API de reservas directamente
 * Este script usa fetch para probar las API sin necesidad de un navegador
 * 
 * Uso:
 * node scripts/test-reservation-api.js
 */

import fetch from 'node-fetch';

// Configuración
const config = {
  baseUrl: 'http://localhost:3000', // Cambia esto si tu app corre en otro puerto
  credentials: {
    email: 'johmarket36@gmail.com',
    password: '123123123' // Reemplaza con la contraseña correcta
  }
};

// Función para iniciar sesión y obtener cookies
async function login() {
  console.log('👤 Iniciando sesión con', config.credentials.email);
  
  const response = await fetch(`${config.baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(config.credentials),
    redirect: 'manual'
  });
  
  // Obtener cookies de la respuesta
  const cookies = response.headers.get('set-cookie');
  
  if (!cookies) {
    throw new Error('No se pudo obtener la cookie de sesión');
  }
  
  console.log('✅ Inicio de sesión exitoso');
  return cookies;
}

// Función para obtener las reservas del usuario
async function getReservations(cookies) {
  console.log('🔍 Obteniendo reservas del cliente');
  
  const response = await fetch(`${config.baseUrl}/my-reservations`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  const html = await response.text();
  
  // Análisis simple para extraer IDs de reservas pendientes
  const reservationIds = [];
  const regex = /data-reservation-id="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    reservationIds.push(match[1]);
  }
  
  console.log(`📋 Encontradas ${reservationIds.length} reservas pendientes`);
  return reservationIds;
}

// Función para cancelar una reserva
async function cancelReservation(cookies, reservationId) {
  console.log(`🧪 Intentando cancelar reserva: ${reservationId}`);
  
  const response = await fetch(`${config.baseUrl}/api/reservation/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({ reservationId })
  });
  
  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ Reserva cancelada exitosamente:', result.message);
  } else {
    console.error('❌ Error al cancelar reserva:', result.error);
  }
  
  return result;
}

// Función principal
async function runTest() {
  console.log('🚀 Iniciando prueba de API de reservas');
  
  try {
    // Paso 1: Iniciar sesión
    const cookies = await login();
    
    // Paso 2: Obtener reservas
    const reservationIds = await getReservations(cookies);
    
    if (reservationIds.length === 0) {
      console.log('ℹ️ No hay reservas pendientes para cancelar');
      return;
    }
    
    // Paso 3: Cancelar la primera reserva (opcional)
    // Descomentar estas líneas para realmente cancelar una reserva
    /*
    const reservationIdToCancel = reservationIds[0];
    console.log(`⚠️ Se cancelará la siguiente reserva: ${reservationIdToCancel}`);
    await cancelReservation(cookies, reservationIdToCancel);
    */
    
    console.log('ℹ️ La cancelación real está desactivada. Descomenta las líneas para activarla.');
    console.log(`ℹ️ IDs de reservas disponibles para cancelar: ${reservationIds.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
runTest().catch(console.error); 