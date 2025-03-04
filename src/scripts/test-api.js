/**
 * Script simple para probar los endpoints de API del cliente
 * 
 * Este script prueba:
 * 1. Actualización de perfil
 * 2. Valoración de reservas
 * 3. Actualización de estado de reservas (cancelación)
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

// URL base de la API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Token de autenticación (deberías obtenerlo al iniciar sesión)
// Este es un ejemplo, en una aplicación real obtendrías el token mediante la autenticación
let authToken = process.env.TEST_AUTH_TOKEN;

/**
 * Función auxiliar para realizar solicitudes
 */
async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${authToken}`
  };
  
  if (!isFormData && data) {
    headers['Content-Type'] = 'application/json';
  }
  
  const options = {
    method,
    headers
  };
  
  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.body = JSON.stringify(data);
    }
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data: result
    };
  } catch (error) {
    console.error(`Error en solicitud a ${url}:`, error);
    return {
      status: 500,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Función auxiliar para imprimir mensajes coloreados
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Prueba para actualizar perfil de cliente
 */
async function testUpdateProfile() {
  log('1. Probando actualización de perfil...', colors.cyan);
  
  // Crear un FormData para simular la carga de un archivo
  const formData = new FormData();
  formData.append('id', process.env.TEST_PROFILE_ID);
  formData.append('name', `Cliente Test ${Date.now()}`);
  formData.append('email', 'cliente.test@example.com');
  formData.append('phone', '+5491123456789');
  formData.append('city', 'Buenos Aires');
  formData.append('description', 'Este es un perfil de prueba actualizado desde el script.');
  
  // Si quieres probar la carga de avatar, descomenta estas líneas
  // const avatarPath = path.join(__dirname, '../test/test-avatar.jpg');
  // if (fs.existsSync(avatarPath)) {
  //   formData.append('avatar', fs.createReadStream(avatarPath));
  // }
  
  const response = await apiRequest('/api/update-profile', 'POST', formData, true);
  
  if (response.ok) {
    log('✅ Actualización de perfil exitosa:', colors.green);
  } else {
    log('❌ Error en actualización de perfil:', colors.red);
  }
  
  console.log(response);
  console.log('-------------------------------------------');
}

/**
 * Prueba para valorar una reserva
 */
async function testRateReservation() {
  log('2. Probando valoración de reserva...', colors.cyan);
  
  const reservationId = process.env.TEST_RESERVATION_ID;
  if (!reservationId) {
    log('❌ ERROR: Debes configurar TEST_RESERVATION_ID en tu archivo .env', colors.red);
    return;
  }
  
  const data = {
    reservationId: reservationId,
    rating: 4,
    review: 'Esta es una valoración de prueba desde el script de API.'
  };
  
  const response = await apiRequest('/api/rate-reservation', 'POST', data);
  
  if (response.ok) {
    log('✅ Valoración de reserva exitosa:', colors.green);
  } else {
    log('❌ Error en valoración de reserva:', colors.red);
  }
  
  console.log(response);
  console.log('-------------------------------------------');
}

/**
 * Prueba para cancelar una reserva
 */
async function testCancelReservation() {
  log('3. Probando cancelación de reserva...', colors.cyan);
  
  const reservationId = process.env.TEST_ACTIVE_RESERVATION_ID;
  if (!reservationId) {
    log('❌ ERROR: Debes configurar TEST_ACTIVE_RESERVATION_ID en tu archivo .env', colors.red);
    return;
  }
  
  const data = {
    id: reservationId,
    status: 'cancelled'
  };
  
  const response = await apiRequest('/api/update-reservation-status', 'POST', data);
  
  if (response.ok) {
    log('✅ Cancelación de reserva exitosa:', colors.green);
  } else {
    log('❌ Error en cancelación de reserva:', colors.red);
  }
  
  console.log(response);
  console.log('-------------------------------------------');
}

/**
 * Función principal que ejecuta todas las pruebas
 */
async function runApiTests() {
  log('Iniciando pruebas de API para funcionalidades del cliente...', colors.magenta);
  console.log('===========================================');
  
  // Verificar que existe el token de autenticación
  if (!authToken) {
    log('⚠️ ADVERTENCIA: No se ha configurado TEST_AUTH_TOKEN en el archivo .env', colors.yellow);
    log('Algunas pruebas podrían fallar si no se proporciona un token de autenticación válido.', colors.yellow);
    
    // Token de ejemplo para pruebas
    authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiY2xpZW50IiwiZXhwIjoxNjkzNDU2Nzg5fQ.example-token';
  }
  
  try {
    // Ejecutar las pruebas
    await testUpdateProfile();
    await testRateReservation();
    await testCancelReservation();
    
    log('✅ Todas las pruebas de API completadas', colors.green);
  } catch (error) {
    log('❌ Error ejecutando las pruebas de API:', colors.red);
    console.error(error);
  }
}

// Ejecutar las pruebas
runApiTests(); 