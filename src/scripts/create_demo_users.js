/**
 * Script para crear usuarios de demostración en Supabase
 * Este script debe ejecutarse con credenciales de administrador
 * Para ejecutar: node src/scripts/create_demo_users.js
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Credenciales para Supabase (deben estar en el archivo .env)
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Las variables de entorno para Supabase no están configuradas.');
  console.error('Asegúrate de tener PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY en tu archivo .env');
  process.exit(1);
}

// Cliente de Supabase con credenciales de admin
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Usuarios de prueba
const demoUsers = [
  // Cliente
  {
    email: 'cliente@ejemplo.com',
    password: 'Cliente123!',
    name: 'Carlos Cliente',
    user_type: 'client',
    city: 'Madrid',
    phone: '+34600111222',
    avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  // Representantes
  {
    email: 'rep1@ejemplo.com',
    password: 'Representante1!',
    name: 'Ana Representante',
    user_type: 'queuer',
    city: 'Barcelona',
    phone: '+34600333444',
    avatar_url: 'https://randomuser.me/api/portraits/women/2.jpg',
    speciality: 'Trámites bancarios',
    rate_per_hour: 20,
    description: 'Especialista en trámites bancarios y gestiones financieras.',
  },
  {
    email: 'rep2@ejemplo.com',
    password: 'Representante2!',
    name: 'Pablo Gestor',
    user_type: 'queuer',
    city: 'Valencia',
    phone: '+34600555666',
    avatar_url: 'https://randomuser.me/api/portraits/men/3.jpg',
    speciality: 'Gestiones administrativas',
    rate_per_hour: 18,
    description: 'Experto en todo tipo de gestiones administrativas y documentación oficial.',
  },
  {
    email: 'rep3@ejemplo.com',
    password: 'Representante3!',
    name: 'Laura Gestora',
    user_type: 'queuer',
    city: 'Sevilla',
    phone: '+34600777888',
    avatar_url: 'https://randomuser.me/api/portraits/women/4.jpg',
    speciality: 'Trámites jurídicos',
    rate_per_hour: 25,
    description: 'Especializada en trámites y gestiones jurídicas de todo tipo.',
  },
  // Administrador
  {
    email: 'admin@ejemplo.com',
    password: 'Admin123!',
    name: 'Admin Sistema',
    user_type: 'admin',
    city: 'Madrid',
    phone: '+34600999000',
    avatar_url: 'https://randomuser.me/api/portraits/men/5.jpg',
    is_admin: true,
  },
];

/**
 * Crea un usuario en Supabase Auth y su perfil correspondiente
 */
async function createUser(userData) {
  try {
    console.log(`Creando usuario: ${userData.name} (${userData.email}) - ${userData.user_type}`);
    
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        name: userData.name,
        user_type: userData.user_type,
      },
    });
    
    if (authError) {
      console.error(`Error al crear usuario en Auth para ${userData.email}:`, authError);
      return null;
    }
    
    const userId = authData.user.id;
    console.log(`Usuario Auth creado con ID: ${userId}`);
    
    // 2. Crear perfil en la tabla profiles
    const profileData = {
      id: userId,
      user_id: userId,
      name: userData.name,
      email: userData.email,
      user_type: userData.user_type,
      city: userData.city,
      phone: userData.phone,
      avatar_url: userData.avatar_url,
      is_active: true,
      is_admin: userData.is_admin || false,
      created_at: new Date().toISOString(),
    };
    
    // Añadir campos específicos para representantes
    if (userData.user_type === 'queuer') {
      profileData.speciality = userData.speciality;
      profileData.rate_per_hour = userData.rate_per_hour;
      profileData.description = userData.description;
      profileData.completed_queues = 0;
      profileData.rating = null;
      profileData.is_verified = false;
    }
    
    // Insertar perfil
    const { data: profileData2, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([profileData]);
    
    if (profileError) {
      console.error(`Error al crear perfil para ${userData.email}:`, profileError);
      return null;
    }
    
    console.log(`Perfil creado exitosamente para ${userData.email}`);
    return { userId, email: userData.email, name: userData.name, user_type: userData.user_type };
  } catch (error) {
    console.error(`Error inesperado al crear usuario ${userData.email}:`, error);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('Iniciando creación de usuarios de prueba...');
  
  const results = [];
  
  for (const userData of demoUsers) {
    const result = await createUser(userData);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n==================================================');
  console.log('Resumen de usuarios creados:');
  console.log('==================================================');
  
  if (results.length === 0) {
    console.log('No se pudo crear ningún usuario.');
  } else {
    results.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Rol: ${user.user_type.toUpperCase()}`);
    });
  }
  
  console.log('\nProceso completado.');
  process.exit(0);
}

// Ejecutar el script
main().catch(err => {
  console.error('Error en la ejecución del script:', err);
  process.exit(1);
}); 