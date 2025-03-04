/**
 * Script para verificar un usuario específico y diagnosticar problemas de sesión
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Verificar si un usuario existe en Auth
 */
async function checkUserInAuth(email) {
  log(`Verificando si el usuario con email ${email} existe en Auth...`, colors.cyan);
  
  try {
    // Usar el admin API para buscar el usuario por email
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    
    if (error) {
      log(`Error al buscar usuarios: ${error.message}`, colors.red);
      log('Intentando método alternativo...', colors.yellow);
      return null;
    }
    
    // Buscar el usuario con el email especificado
    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      log(`No se encontró el usuario con email ${email} en Auth.`, colors.red);
      return null;
    }
    
    log(`Usuario encontrado en Auth:`, colors.green);
    log(`- ID: ${user.id}`, colors.green);
    log(`- Email: ${user.email}`, colors.green);
    log(`- Email confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}`, colors.green);
    log(`- Último acceso: ${user.last_sign_in_at || 'Nunca'}`, colors.green);
    
    return user;
  } catch (error) {
    log(`Error inesperado al buscar usuario en Auth: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Verificar si un usuario existe en la tabla Profiles
 */
async function checkUserInProfiles(email) {
  log(`Verificando si el usuario con email ${email} existe en la tabla Profiles...`, colors.cyan);
  
  try {
    // Buscar perfil por email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      log(`Error al buscar perfil: ${error.message}`, colors.red);
      return null;
    }
    
    if (!profile) {
      log(`No se encontró perfil para el email ${email} en la tabla Profiles.`, colors.red);
      return null;
    }
    
    log(`Perfil encontrado:`, colors.green);
    log(`- ID: ${profile.id}`, colors.green);
    log(`- User ID: ${profile.user_id}`, colors.green);
    log(`- Nombre: ${profile.name || 'No especificado'}`, colors.green);
    log(`- Email: ${profile.email}`, colors.green);
    log(`- Tipo de usuario: ${profile.user_type || 'No especificado'}`, colors.green);
    
    return profile;
  } catch (error) {
    log(`Error inesperado al buscar perfil: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Intentar iniciar sesión como el usuario
 */
async function testLogin(email, password = 'Password123!') {
  log(`Intentando iniciar sesión con el email ${email}...`, colors.cyan);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      log(`Error al iniciar sesión: ${error.message}`, colors.red);
      log(`Posibles causas:`, colors.yellow);
      log(`1. La contraseña es incorrecta`, colors.yellow);
      log(`2. La cuenta no está confirmada`, colors.yellow);
      log(`3. La cuenta no existe`, colors.yellow);
      return null;
    }
    
    log(`Inicio de sesión exitoso:`, colors.green);
    log(`- ID de usuario: ${data.user.id}`, colors.green);
    log(`- Email: ${data.user.email}`, colors.green);
    log(`- Token válido: ${!!data.session.access_token}`, colors.green);
    
    return data;
  } catch (error) {
    log(`Error inesperado al intentar iniciar sesión: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Verificar si el usuario es cliente
 */
async function checkIfUserIsClient(userId) {
  if (!userId) return false;
  
  log(`Verificando si el usuario es cliente...`, colors.cyan);
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      log(`Error al verificar tipo de usuario: ${error.message}`, colors.red);
      return false;
    }
    
    if (!profile) {
      log(`No se encontró perfil para el usuario ${userId}.`, colors.red);
      return false;
    }
    
    const isClient = profile.user_type === 'client';
    
    if (isClient) {
      log(`El usuario es un cliente.`, colors.green);
    } else {
      log(`El usuario NO es un cliente, es: ${profile.user_type}.`, colors.yellow);
    }
    
    return isClient;
  } catch (error) {
    log(`Error inesperado al verificar tipo de usuario: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  const targetEmail = 'johnmarket36@gmail.com';
  log('=============================================', colors.magenta);
  log(`Diagnóstico de usuario: ${targetEmail}`, colors.magenta);
  log('=============================================', colors.magenta);
  
  // 1. Verificar si el usuario existe en Auth
  const authUser = await checkUserInAuth(targetEmail);
  
  // 2. Verificar si el usuario existe en Profiles
  const userProfile = await checkUserInProfiles(targetEmail);
  
  // 3. Si no existe, sugerir crearlo
  if (!authUser && !userProfile) {
    log('\nDiagnóstico: El usuario no existe en el sistema.', colors.yellow);
    log('Recomendación: Regístrate primero con este email.', colors.yellow);
    return;
  }
  
  // 4. Si existe en Auth pero no en Profiles, o viceversa
  if (authUser && !userProfile) {
    log('\nDiagnóstico: El usuario existe en Auth pero no tiene perfil.', colors.yellow);
    log('Recomendación: Completa tu perfil después de iniciar sesión.', colors.yellow);
  } else if (!authUser && userProfile) {
    log('\nDiagnóstico: Existe un perfil pero no hay usuario en Auth.', colors.yellow);
    log('Recomendación: Registra una nueva cuenta con este email.', colors.yellow);
  }
  
  // 5. Si existe en ambos, verificar si los IDs coinciden
  if (authUser && userProfile) {
    if (authUser.id !== userProfile.user_id) {
      log('\nDiagnóstico: ¡Problema! El ID de Auth y el ID en Profiles no coinciden.', colors.red);
      log(`ID en Auth: ${authUser.id}`, colors.red);
      log(`ID en Profiles (user_id): ${userProfile.user_id}`, colors.red);
      log('Recomendación: Contacta con el administrador del sistema para corregir este problema.', colors.yellow);
    } else {
      log('\nDiagnóstico: El usuario existe correctamente en Auth y Profiles con IDs coincidentes.', colors.green);
    }
  }
  
  // 6. Probar inicio de sesión
  if (authUser) {
    log('\n--- Prueba de inicio de sesión ---', colors.cyan);
    const loginResult = await testLogin(targetEmail);
    
    if (loginResult) {
      const isClient = await checkIfUserIsClient(loginResult.user.id);
      
      if (!isClient) {
        log('\nDiagnóstico: El usuario puede iniciar sesión pero no es un cliente.', colors.yellow);
        log('Recomendación: Verifica que este usuario tenga el tipo "client" en la tabla Profiles.', colors.yellow);
      }
    }
  }
  
  log('\n=============================================', colors.magenta);
  log('Diagnóstico completo', colors.magenta);
  log('=============================================', colors.magenta);
}

// Ejecutar el script
main()
  .catch(err => {
    log(`Error general: ${err.message}`, colors.red);
    process.exit(1);
  })
  .finally(() => {
    // No cerramos explícitamente porque Supabase ya maneja esto
  }); 