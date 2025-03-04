/**
 * Script para crear 5 representantes adicionales en Supabase
 * Este script debe ejecutarse con credenciales de administrador
 * Para ejecutar: node src/scripts/create_more_queuers.js
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

// 5 Representantes adicionales con datos más variados
const additionalQueuers = [
  {
    email: 'rep4@ejemplo.com',
    password: 'Representante4!',
    name: 'Miguel Serrano',
    user_type: 'queuer',
    city: 'Madrid',
    phone: '+34611222333',
    avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg',
    speciality: 'Trámites municipales',
    rate_per_hour: 19,
    description: 'Especialista en trámites y gestiones en el ayuntamiento. Gran experiencia en licencias y permisos.',
    rating: 4.7,
    completed_queues: 42
  },
  {
    email: 'rep5@ejemplo.com',
    password: 'Representante5!',
    name: 'Carmen Ortiz',
    user_type: 'queuer',
    city: 'Barcelona',
    phone: '+34622333444',
    avatar_url: 'https://randomuser.me/api/portraits/women/23.jpg',
    speciality: 'Gestiones médicas',
    rate_per_hour: 22,
    description: 'Especializada en acompañamiento y trámites médicos. Disponible para gestiones en centros de salud y hospitales.',
    rating: 4.9,
    completed_queues: 78
  },
  {
    email: 'rep6@ejemplo.com',
    password: 'Representante6!',
    name: 'Javier Méndez',
    user_type: 'queuer',
    city: 'Valencia',
    phone: '+34633444555',
    avatar_url: 'https://randomuser.me/api/portraits/men/24.jpg',
    speciality: 'Trámites de extranjería',
    rate_per_hour: 24,
    description: 'Experto en trámites de extranjería y documentación para residentes extranjeros.',
    rating: 4.5,
    completed_queues: 35
  },
  {
    email: 'rep7@ejemplo.com',
    password: 'Representante7!',
    name: 'Lucía Fernández',
    user_type: 'queuer',
    city: 'Málaga',
    phone: '+34644555666',
    avatar_url: 'https://randomuser.me/api/portraits/women/25.jpg',
    speciality: 'Trámites educativos',
    rate_per_hour: 20,
    description: 'Especialista en trámites relacionados con el sistema educativo. Matrícula, becas y ayudas.',
    rating: 4.6,
    completed_queues: 29
  },
  {
    email: 'rep8@ejemplo.com',
    password: 'Representante8!',
    name: 'Roberto Alonso',
    user_type: 'queuer',
    city: 'Sevilla',
    phone: '+34655666777',
    avatar_url: 'https://randomuser.me/api/portraits/men/26.jpg',
    speciality: 'Gestiones inmobiliarias',
    rate_per_hour: 23,
    description: 'Experto en trámites inmobiliarios, registro de propiedad y gestiones notariales.',
    rating: 4.8,
    completed_queues: 53
  }
];

/**
 * Crea un usuario en Supabase Auth y su perfil correspondiente
 */
async function createUser(userData) {
  try {
    console.log(`Creando representante: ${userData.name} (${userData.email})`);
    
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
      created_at: new Date().toISOString(),
      speciality: userData.speciality,
      rate_per_hour: userData.rate_per_hour,
      description: userData.description,
      completed_queues: userData.completed_queues || 0,
      rating: userData.rating || null,
      is_verified: true, // Marcar como verificados para que aparezcan más fácilmente
      is_admin: false
    };
    
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
  console.log('Iniciando creación de 5 representantes adicionales...');
  
  const results = [];
  
  for (const userData of additionalQueuers) {
    const result = await createUser(userData);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n==================================================');
  console.log('Resumen de representantes creados:');
  console.log('==================================================');
  
  if (results.length === 0) {
    console.log('No se pudo crear ningún representante.');
  } else {
    results.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Especialidad: ${additionalQueuers[index].speciality}`);
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