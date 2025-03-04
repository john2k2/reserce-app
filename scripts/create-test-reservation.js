/**
 * Script para crear una reserva de prueba para un usuario específico
 * Este script se conecta directamente a Supabase para insertar datos
 * 
 * Uso:
 * 1. npm install @supabase/supabase-js dotenv
 * 2. Crear archivo .env con SUPABASE_URL y SUPABASE_KEY
 * 3. node scripts/create-test-reservation.js
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

// Determinar la ruta correcta al archivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const envPath = resolve(rootDir, '.env');

// Verificar si el archivo .env existe
if (!existsSync(envPath)) {
  console.error(`❌ Error: No se encontró el archivo .env en ${envPath}`);
  console.log('Crea un archivo .env en la raíz del proyecto con el siguiente contenido:');
  console.log(`
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-service-role
`);
  process.exit(1);
}

// Cargar variables de entorno
console.log(`📁 Cargando variables de entorno desde: ${envPath}`);
dotenv.config({ path: envPath });

// Verificar las variables de entorno - intentar nombres alternativos si los principales no existen
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_KEY;

// Si no se encuentran las variables con los nombres esperados, intentar con nombres alternativos
if (!supabaseUrl && process.env.PUBLIC_SUPABASE_URL) {
  supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  console.log('ℹ️ Usando PUBLIC_SUPABASE_URL como alternativa');
}

if (!supabaseKey && process.env.SUPABASE_SERVICE_KEY) {
  supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  console.log('ℹ️ Usando SUPABASE_SERVICE_KEY como alternativa');
}

console.log('🔍 Diagnóstico de variables de entorno:');
console.log(`- SUPABASE_URL: ${supabaseUrl ? '✅ Configurada' : '❌ No encontrada'}`);
console.log(`- SUPABASE_KEY: ${supabaseKey ? '✅ Configurada' : '❌ No encontrada'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Debes configurar SUPABASE_URL y SUPABASE_KEY en el archivo .env');
  
  // Intento de leer el archivo .env directamente para verificar su contenido
  try {
    const envContent = readFileSync(envPath, 'utf8');
    console.log('\nContenido del archivo .env:');
    console.log(envContent);
    
    // Verificar si hay errores comunes de formato o nombres alternativos
    if (!envContent.includes('SUPABASE_URL=')) {
      console.log('\n⚠️ No se encontró SUPABASE_URL en el archivo .env');
      if (envContent.includes('PUBLIC_SUPABASE_URL=')) {
        console.log('💡 Se encontró PUBLIC_SUPABASE_URL. Usa ese valor para SUPABASE_URL en el .env');
      }
    }
    if (!envContent.includes('SUPABASE_KEY=')) {
      console.log('\n⚠️ No se encontró SUPABASE_KEY en el archivo .env');
      if (envContent.includes('SUPABASE_SERVICE_KEY=')) {
        console.log('💡 Se encontró SUPABASE_SERVICE_KEY. Usa ese valor para SUPABASE_KEY en el .env');
      }
    }
    if (envContent.includes(' =') || envContent.includes('= ')) {
      console.log('\n⚠️ El archivo .env puede tener espacios antes o después de los signos igual. El formato correcto es SIN espacios: CLAVE=valor');
    }
  } catch (error) {
    console.error(`Error al leer el archivo .env: ${error.message}`);
  }
  
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración
const config = {
  userEmail: 'johmarket36@gmail.com',
  testData: {
    status: 'pending', // pending, confirmed, in_progress, completed, cancelled
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días desde ahora
    location: 'Prueba - Centro Comercial Las Américas',
    details: 'Esta es una reserva de prueba creada automáticamente.'
  }
};

// Función principal
async function createTestReservation() {
  console.log('🚀 Iniciando creación de reserva de prueba');
  console.log(`👤 Usuario: ${config.userEmail}`);
  
  try {
    // Verificar la conexión a Supabase
    console.log('🔌 Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase.from('profiles').select('count').limit(1);
    
    if (testError) {
      throw new Error(`No se pudo conectar a Supabase: ${testError.message}`);
    }
    
    console.log('✅ Conexión a Supabase establecida correctamente');
    
    // Paso 1: Obtener el ID del usuario
    console.log('🔍 Buscando perfil del usuario...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', config.userEmail)
      .single();
    
    if (profileError || !profileData) {
      throw new Error(`No se encontró el perfil para ${config.userEmail}: ${profileError?.message || 'Usuario no encontrado'}`);
    }
    
    const clientId = profileData.id;
    console.log(`✅ Perfil encontrado. ID: ${clientId}`);
    
    // Paso 2: Obtener un representante al azar
    console.log('🔍 Buscando un representante disponible...');
    const { data: queuerData, error: queuerError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('user_type', 'queuer')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (queuerError || !queuerData) {
      throw new Error(`No se encontró ningún representante disponible: ${queuerError?.message || 'Sin representantes'}`);
    }
    
    const queuerId = queuerData.id;
    console.log(`✅ Representante encontrado: ${queuerData.name} (ID: ${queuerId})`);
    
    // Paso 3: Obtener un servicio al azar
    console.log('🔍 Buscando un servicio disponible...');
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('id, name')
      .limit(1)
      .single();
    
    if (serviceError || !serviceData) {
      throw new Error(`No se encontró ningún servicio disponible: ${serviceError?.message || 'Sin servicios'}`);
    }
    
    const serviceId = serviceData.id;
    console.log(`✅ Servicio encontrado: ${serviceData.name} (ID: ${serviceId})`);
    
    // Paso 4: Crear la reserva
    console.log('📝 Creando reserva de prueba...');
    
    const reservationData = {
      client_id: clientId,
      queuer_id: queuerId,
      service_id: serviceId,
      status: config.testData.status,
      date: config.testData.date,
      location: config.testData.location,
      details: config.testData.details,
      created_at: new Date().toISOString()
    };
    
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();
    
    if (reservationError) {
      throw new Error(`Error al crear la reserva: ${reservationError.message}`);
    }
    
    console.log('✅ Reserva creada exitosamente:');
    console.log(JSON.stringify({
      id: reservation.id,
      status: reservation.status,
      date: new Date(reservation.date).toLocaleString(),
      service: serviceData.name,
      queuer: queuerData.name
    }, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar
createTestReservation().catch(console.error); 