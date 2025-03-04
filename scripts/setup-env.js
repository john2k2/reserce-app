#!/usr/bin/env node

/**
 * Script para configurar el archivo .env con las credenciales de Supabase
 * Uso: node scripts/setup-env.js
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

// Determinar la ruta correcta al archivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const envPath = resolve(rootDir, '.env');

// Crear interfaz para leer entrada del usuario
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para preguntar al usuario
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('🛠️  Asistente de configuración de .env para pruebas de "Mis Reservas"');
  console.log('-------------------------------------------------------------');
  console.log('Este script te ayudará a crear el archivo .env necesario para ejecutar los scripts de prueba.');
  
  if (existsSync(envPath)) {
    console.log(`\n⚠️  Ya existe un archivo .env en ${envPath}`);
    const overwrite = await question('¿Deseas sobrescribirlo? (s/n): ');
    
    if (overwrite.toLowerCase() !== 's') {
      console.log('\n❌ Configuración cancelada. Se conserva el archivo .env existente.');
      rl.close();
      return;
    }
  }
  
  console.log('\n📋 Necesitamos las siguientes credenciales de Supabase:');
  console.log('- SUPABASE_URL: La URL de tu proyecto (ej: https://tu-proyecto.supabase.co)');
  console.log('- SUPABASE_KEY: La clave de service_role (¡no la anon key!)');
  console.log('\nPuedes encontrar estas credenciales en el panel de Supabase > Configuración del proyecto > API');
  
  const supabaseUrl = await question('\nSUPABASE_URL: ');
  
  if (!supabaseUrl) {
    console.log('\n❌ SUPABASE_URL es requerida. Configuración cancelada.');
    rl.close();
    return;
  }
  
  const supabaseKey = await question('SUPABASE_KEY: ');
  
  if (!supabaseKey) {
    console.log('\n❌ SUPABASE_KEY es requerida. Configuración cancelada.');
    rl.close();
    return;
  }
  
  // Crear contenido del archivo .env
  const envContent = `# Configuración de Supabase para pruebas
SUPABASE_URL=${supabaseUrl}
SUPABASE_KEY=${supabaseKey}

# No agregues espacios antes o después de los signos igual (=)
`;
  
  try {
    writeFileSync(envPath, envContent);
    console.log(`\n✅ Archivo .env creado exitosamente en ${envPath}`);
    console.log('\nAhora puedes ejecutar los scripts de prueba:');
    console.log('1. node scripts/create-test-reservation.js - Para crear una reserva de prueba');
    console.log('2. node scripts/test-reservations.js - Para probar la interfaz de usuario');
    console.log('3. node scripts/test-reservation-api.js - Para probar la API directamente');
  } catch (error) {
    console.error(`\n❌ Error al crear el archivo .env: ${error.message}`);
  }
  
  rl.close();
}

setup().catch(console.error); 