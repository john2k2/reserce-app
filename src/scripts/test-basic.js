/**
 * Script básico para verificar la conexión a Supabase y mostrar datos
 * 
 * Este script simplemente verifica que:
 * 1. La conexión a Supabase funciona correctamente
 * 2. Muestra los perfiles existentes en la base de datos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configurar cliente de Supabase
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\x1b[31mError: Faltan variables de entorno necesarias.\x1b[0m');
  console.error('Por favor, asegúrate de tener las siguientes variables en tu archivo .env:');
  console.error('- PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY');
  process.exit(1);
}

console.log('\x1b[36mConectando a Supabase...\x1b[0m');
console.log(`URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  try {
    console.log('\x1b[36mVerificando conexión a Supabase...\x1b[0m');
    
    // Probar la conexión con una consulta simple
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    console.log('\x1b[32m✓ Conexión exitosa a Supabase!\x1b[0m');
    return true;
  } catch (error) {
    console.error('\x1b[31m✗ Error al conectar con Supabase:\x1b[0m', error);
    return false;
  }
}

async function listProfiles() {
  try {
    console.log('\x1b[36mListando perfiles existentes...\x1b[0m');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (error) throw error;
    
    if (data.length === 0) {
      console.log('\x1b[33mNo se encontraron perfiles en la base de datos.\x1b[0m');
      return;
    }
    
    console.log('\x1b[32mPerfiles encontrados:\x1b[0m');
    data.forEach((profile, index) => {
      console.log(`\n\x1b[33mPerfil #${index + 1}:\x1b[0m`);
      console.log(`ID: ${profile.id}`);
      console.log(`Email: ${profile.email}`);
      console.log(`Nombre: ${profile.name || 'No especificado'}`);
      console.log(`Tipo: ${profile.user_type || 'No especificado'}`);
      console.log(`Creado: ${profile.created_at || 'No especificado'}`);
    });
    
    const clientProfiles = data.filter(profile => profile.user_type === 'client');
    if (clientProfiles.length > 0) {
      console.log('\n\x1b[32mPerfiles de tipo cliente encontrados:\x1b[0m', clientProfiles.length);
      console.log('\x1b[36mPuedes usar cualquiera de estos emails para tus pruebas.\x1b[0m');
      clientProfiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.email}`);
      });
    } else {
      console.log('\n\x1b[33mNo se encontraron perfiles de tipo cliente.\x1b[0m');
      console.log('Deberás crear un usuario de cliente para ejecutar las pruebas.');
    }
  } catch (error) {
    console.error('\x1b[31mError al listar perfiles:\x1b[0m', error);
  }
}

async function listServices() {
  try {
    console.log('\n\x1b[36mListando servicios disponibles...\x1b[0m');
    
    const { data, error } = await supabase
      .from('services')
      .select('*');
    
    if (error) throw error;
    
    if (data.length === 0) {
      console.log('\x1b[33mNo se encontraron servicios en la base de datos.\x1b[0m');
      return;
    }
    
    console.log('\x1b[32mServicios encontrados:\x1b[0m');
    data.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.id})`);
    });
  } catch (error) {
    console.error('\x1b[31mError al listar servicios:\x1b[0m', error);
  }
}

async function main() {
  console.log('\x1b[35m===========================================\x1b[0m');
  console.log('\x1b[35mTest Básico de Conexión a Supabase\x1b[0m');
  console.log('\x1b[35m===========================================\x1b[0m');
  
  // Verificar conexión
  const isConnected = await testSupabaseConnection();
  
  if (!isConnected) {
    console.error('\n\x1b[31mNo se pudo establecer conexión con Supabase.\x1b[0m');
    console.error('Verifica tu archivo .env y asegúrate de que las credenciales sean correctas.');
    process.exit(1);
  }
  
  // Listar perfiles
  await listProfiles();
  
  // Listar servicios
  await listServices();
  
  console.log('\n\x1b[35m===========================================\x1b[0m');
  console.log('\x1b[32mTest básico completado\x1b[0m');
  console.log('\x1b[35m===========================================\x1b[0m');
}

// Ejecutar script
main(); 