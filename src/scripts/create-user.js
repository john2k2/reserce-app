/**
 * Script para crear un usuario específico en el sistema
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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

// Función para generar un UUID
function generateUUID() {
  try {
    return uuidv4();
  } catch (error) {
    // Si no está disponible uuid, usar un método alternativo
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

/**
 * Crear un usuario en Auth
 */
async function createUserInAuth(email, password, userData = {}) {
  log(`Creando usuario con email ${email} en Auth...`, colors.cyan);
  
  try {
    // Crear usuario usando Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email para pruebas
      user_metadata: userData
    });
    
    if (error) {
      log(`Error al crear usuario: ${error.message}`, colors.red);
      
      // Si el error es porque el usuario ya existe, intentar recuperarlo
      if (error.message.includes('already exists')) {
        log('El usuario ya existe. Intentando recuperar información...', colors.yellow);
        
        // Intentar iniciar sesión para ver si podemos recuperar el usuario
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          log(`No se pudo iniciar sesión con el usuario existente: ${signInError.message}`, colors.red);
          log('Es posible que la contraseña sea diferente a la especificada.', colors.yellow);
          return null;
        }
        
        log(`Se recuperó el usuario existente:`, colors.green);
        log(`- ID: ${signInData.user.id}`, colors.green);
        log(`- Email: ${signInData.user.email}`, colors.green);
        
        return signInData.user;
      }
      
      return null;
    }
    
    log(`Usuario creado exitosamente:`, colors.green);
    log(`- ID: ${data.user.id}`, colors.green);
    log(`- Email: ${data.user.email}`, colors.green);
    
    return data.user;
  } catch (error) {
    log(`Error inesperado al crear usuario: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Crear un perfil para el usuario
 */
async function createUserProfile(user, profileData) {
  if (!user) return null;
  
  log(`Creando perfil para el usuario ${user.id}...`, colors.cyan);
  
  const defaultProfile = {
    id: generateUUID(), // Generar un UUID para el id del perfil
    user_id: user.id,
    email: user.email,
    name: 'John Market',
    user_type: 'client',
    city: 'Ciudad de México',
    phone: '+1234567890'
  };
  
  const profile = { ...defaultProfile, ...profileData };
  
  try {
    // Verificar si ya existe un perfil para este usuario
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (checkError) {
      log(`Error al verificar perfil existente: ${checkError.message}`, colors.red);
    } else if (existingProfile) {
      log(`Ya existe un perfil para este usuario:`, colors.yellow);
      log(`- ID: ${existingProfile.id}`, colors.yellow);
      log(`- Nombre: ${existingProfile.name || 'No especificado'}`, colors.yellow);
      log(`- Tipo: ${existingProfile.user_type || 'No especificado'}`, colors.yellow);
      
      // Actualizar el perfil existente
      log(`Actualizando perfil existente...`, colors.cyan);
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          user_type: profile.user_type,
          city: profile.city,
          phone: profile.phone
        })
        .eq('id', existingProfile.id)
        .select()
        .single();
      
      if (updateError) {
        log(`Error al actualizar perfil: ${updateError.message}`, colors.red);
        return existingProfile; // Devolver el perfil existente sin cambios
      }
      
      log(`Perfil actualizado correctamente:`, colors.green);
      log(`- ID: ${updatedProfile.id}`, colors.green);
      log(`- Nombre: ${updatedProfile.name}`, colors.green);
      log(`- Tipo: ${updatedProfile.user_type}`, colors.green);
      
      return updatedProfile;
    }
    
    // Si no existe, crear un nuevo perfil
    log(`Insertando nuevo perfil con ID: ${profile.id}...`, colors.cyan);
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (insertError) {
      log(`Error al crear perfil: ${insertError.message}`, colors.red);
      
      // Mostrar los detalles del error para diagnóstico
      log('Detalles del perfil que intentamos crear:', colors.yellow);
      console.log(profile);
      
      // Intentar un enfoque alternativo sin especificar el ID
      log('Intentando crear perfil sin especificar ID...', colors.yellow);
      
      const alternativeProfile = { ...profile };
      delete alternativeProfile.id; // Quitar el ID para que Supabase lo genere
      
      const { data: altProfile, error: altError } = await supabase
        .from('profiles')
        .insert(alternativeProfile)
        .select()
        .single();
      
      if (altError) {
        log(`Error en el segundo intento: ${altError.message}`, colors.red);
        
        // Último intento: solo insertar los campos mínimos necesarios
        log('Último intento: insertar solo campos esenciales...', colors.yellow);
        
        const minimalProfile = {
          user_id: user.id,
          email: user.email,
          user_type: 'client'
        };
        
        const { data: minProfile, error: minError } = await supabase
          .from('profiles')
          .insert(minimalProfile)
          .select()
          .single();
        
        if (minError) {
          log(`Error en el último intento: ${minError.message}`, colors.red);
          
          // Obtener la estructura de la tabla para diagnóstico
          log('Obteniendo estructura de la tabla profiles...', colors.blue);
          
          // Esto es solo para diagnóstico, no necesariamente funcionará
          const { data: tableInfo, error: tableError } = await supabase
            .rpc('debug_table_structure', { table_name: 'profiles' });
          
          if (!tableError && tableInfo) {
            log('Estructura de la tabla:', colors.blue);
            console.log(tableInfo);
          }
          
          return null;
        }
        
        log(`Perfil mínimo creado con éxito:`, colors.green);
        log(`- ID: ${minProfile.id}`, colors.green);
        log(`- User ID: ${minProfile.user_id}`, colors.green);
        
        return minProfile;
      }
      
      log(`Perfil alternativo creado con éxito:`, colors.green);
      log(`- ID: ${altProfile.id}`, colors.green);
      log(`- Nombre: ${altProfile.name}`, colors.green);
      
      return altProfile;
    }
    
    log(`Perfil creado exitosamente:`, colors.green);
    log(`- ID: ${newProfile.id}`, colors.green);
    log(`- Nombre: ${newProfile.name}`, colors.green);
    log(`- Tipo: ${newProfile.user_type}`, colors.green);
    
    return newProfile;
  } catch (error) {
    log(`Error inesperado al crear perfil: ${error.message}`, colors.red);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  // Datos del usuario a crear
  const userData = {
    email: 'johnmarket36@gmail.com',
    password: 'Password123!', // Usar una contraseña segura en producción
    profile: {
      name: 'John Market',
      user_type: 'client',
      city: 'Ciudad de México',
      phone: '+1234567890'
    }
  };
  
  log('=============================================', colors.magenta);
  log(`Creación de usuario: ${userData.email}`, colors.magenta);
  log('=============================================', colors.magenta);
  
  try {
    // 1. Crear usuario en Auth
    const user = await createUserInAuth(userData.email, userData.password);
    
    if (!user) {
      log('No se pudo crear el usuario en Auth. Proceso cancelado.', colors.red);
      return;
    }
    
    // 2. Crear perfil para el usuario
    const profile = await createUserProfile(user, userData.profile);
    
    if (!profile) {
      log('Se creó el usuario en Auth pero no se pudo crear su perfil.', colors.yellow);
      log('Recomendación: Intenta completar tu perfil después de iniciar sesión.', colors.yellow);
      return;
    }
    
    // 3. Resumen final
    log('\n=============================================', colors.magenta);
    log('Usuario creado exitosamente', colors.green);
    log('=============================================', colors.magenta);
    log(`Email: ${userData.email}`, colors.green);
    log(`Contraseña: ${userData.password}`, colors.green);
    log(`Nombre: ${profile.name || 'No especificado'}`, colors.green);
    log(`Tipo: ${profile.user_type || 'No especificado'}`, colors.green);
    log('\nAhora puedes iniciar sesión con estas credenciales.', colors.green);
  } catch (error) {
    log(`\nError general en el proceso: ${error.message}`, colors.red);
  }
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