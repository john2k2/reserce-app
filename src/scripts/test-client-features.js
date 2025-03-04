/**
 * Script de prueba para las funcionalidades del rol de cliente
 * 
 * Este script prueba:
 * 1. Autenticación y obtención del perfil de cliente
 * 2. Actualización del perfil del cliente
 * 3. Búsqueda de representantes (queuers)
 * 4. Creación de una reserva
 * 5. Obtención de reservas activas
 * 6. Cancelación de una reserva
 * 7. Valoración de una reserva completada
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

// Configurar cliente de Supabase
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Credenciales de prueba - Asegúrate de que estos usuarios existan en tu base de datos
const TEST_CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || 'cliente.prueba@example.com';
const TEST_CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || 'contraseña123';

// Variables globales
let userId;
let profileId;
let reservationId;
let queuerProfileId;

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

/**
 * Función auxiliar para imprimir mensajes coloreados
 */
function log(message, color = colors.reset, isError = false) {
  const output = isError ? console.error : console.log;
  output(`${color}${message}${colors.reset}`);
}

/**
 * Función auxiliar para imprimir resultados de pruebas
 */
function printResult(name, success, result) {
  const color = success ? colors.green : colors.red;
  const status = success ? 'ÉXITO' : 'ERROR';
  log(`[${status}] ${name}`, color);
  if (!success || process.env.DEBUG) {
    console.log(result);
  }
  console.log('-------------------------------------------');
}

/**
 * Función para esperar un tiempo determinado
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica si las credenciales de Supabase son válidas
 */
async function checkSupabaseCredentials() {
  try {
    log('Verificando credenciales de Supabase...', colors.cyan);
    
    // Intentar una operación simple con la base de datos
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    printResult('Verificación de conexión a Supabase', true, { message: 'Conexión exitosa a Supabase' });
    return true;
  } catch (error) {
    printResult('Verificación de conexión a Supabase', false, error);
    throw new Error('No se pudo conectar a Supabase. Verifica tus credenciales PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY en el archivo .env');
  }
}

/**
 * Crear un usuario de prueba si no existe
 */
async function createTestUserIfNeeded() {
  try {
    log('Verificando si el usuario de prueba existe...', colors.cyan);
    
    // Intentar iniciar sesión para ver si el usuario existe
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD,
    });
    
    // Si el inicio de sesión es exitoso, el usuario ya existe
    if (!signInError) {
      printResult('Verificación de usuario', true, { message: 'El usuario de prueba ya existe' });
      userId = signInData.user.id;
      return signInData;
    }
    
    // Si el error no es de credenciales inválidas (por ejemplo, si es un error de red), lanzar el error
    if (signInError.message !== 'Invalid login credentials' && signInError.code !== 'invalid_credentials') {
      throw signInError;
    }
    
    log('Usuario de prueba no encontrado, intentando crear uno nuevo...', colors.yellow);
    
    // Crear un nuevo usuario
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD,
      email_confirm: true, // Confirmar el email automáticamente
      user_metadata: {
        role: 'client'
      }
    });
    
    if (signUpError) {
      throw signUpError;
    }
    
    userId = signUpData.user.id;
    
    // Crear un perfil para el nuevo usuario
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        user_id: userId,
        email: TEST_CLIENT_EMAIL,
        name: 'Cliente de Prueba',
        user_type: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    printResult('Creación de usuario de prueba', true, {
      user: signUpData.user,
      profile: profileData
    });
    
    return signUpData;
  } catch (error) {
    printResult('Creación de usuario de prueba', false, error);
    throw new Error(`No se pudo crear el usuario de prueba: ${error.message}`);
  }
}

/**
 * 1. Iniciar sesión como cliente
 */
async function loginAsClient() {
  try {
    log('1. Iniciando sesión como cliente...', colors.cyan);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_CLIENT_EMAIL,
      password: TEST_CLIENT_PASSWORD,
    });
    
    if (error) throw error;
    
    userId = data.user.id;
    
    printResult('Inicio de sesión', true, data);
    return data;
  } catch (error) {
    printResult('Inicio de sesión', false, error);
    throw error;
  }
}

/**
 * 2. Obtener perfil del cliente
 */
async function getClientProfile() {
  try {
    log('2. Obteniendo perfil del cliente...', colors.cyan);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    profileId = data.id;
    
    printResult('Obtener perfil', true, data);
    return data;
  } catch (error) {
    printResult('Obtener perfil', false, error);
    throw error;
  }
}

/**
 * 3. Actualizar perfil del cliente
 */
async function updateClientProfile() {
  try {
    log('3. Actualizando perfil del cliente...', colors.cyan);
    
    const updateData = {
      name: `Cliente Prueba ${Date.now()}`,
      phone: `+123456789${Math.floor(Math.random() * 100)}`,
      city: 'Ciudad de Prueba',
      description: 'Esta es una descripción de prueba actualizada por el script de prueba.',
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId)
      .select();
    
    if (error) throw error;
    
    printResult('Actualizar perfil', true, data);
    return data;
  } catch (error) {
    printResult('Actualizar perfil', false, error);
    throw error;
  }
}

/**
 * 4. Buscar representantes disponibles
 */
async function searchQueuers() {
  try {
    log('4. Buscando representantes disponibles...', colors.cyan);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'queuer')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    if (data.length === 0) {
      throw new Error('No se encontraron representantes activos. Asegúrate de tener representantes en la base de datos.');
    }
    
    // Seleccionar un representante al azar para pruebas
    const randomIndex = Math.floor(Math.random() * data.length);
    queuerProfileId = data[randomIndex].id;
    
    printResult('Buscar representantes', true, {
      total: data.length,
      selectedQueuer: data[randomIndex]
    });
    return data;
  } catch (error) {
    printResult('Buscar representantes', false, error);
    throw error;
  }
}

/**
 * 5. Obtener servicios disponibles para un representante
 */
async function getQueuerServices() {
  try {
    log('5. Obteniendo servicios del representante...', colors.cyan);
    
    try {
      // 1. Primero intentar usando la relación directa (si está configurada)
      const { data: directData, error: directError } = await supabase
        .from('queuer_services')
        .select('*, service:service_id(*)')
        .eq('queuer_id', queuerProfileId);
      
      if (!directError && directData.length > 0) {
        // Si funciona la consulta con relación directa, usamos esos datos
        const randomIndex = Math.floor(Math.random() * directData.length);
        const selectedService = directData[randomIndex];
        
        printResult('Obtener servicios (relación directa)', true, {
          total: directData.length,
          selectedService
        });
        return { services: directData, selectedService };
      }
    } catch (directQueryError) {
      log(`Error en consulta con relación directa: ${directQueryError.message}`, colors.yellow);
    }
    
    // 2. Si falla la relación directa, intentamos con un enfoque manual
    log('Intentando enfoque alternativo para obtener servicios...', colors.yellow);
    
    // Primero obtenemos los servicios asociados al queuer sin usar relaciones
    const { data: qs, error: qsError } = await supabase
      .from('queuer_services')
      .select('*')
      .eq('queuer_id', queuerProfileId);
    
    if (qsError) throw qsError;
    
    if (qs.length === 0) {
      throw new Error(`El representante ${queuerProfileId} no tiene servicios disponibles. Añade servicios para este representante.`);
    }
    
    // Obtener los IDs de los servicios
    const serviceIds = qs.map(item => item.service_id);
    
    // Consultar los servicios por sus IDs
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .in('id', serviceIds);
    
    if (servicesError) throw servicesError;
    
    // Combinar los datos manualmente
    const combinedData = qs.map(queuerService => {
      const service = services.find(s => s.id === queuerService.service_id);
      return {
        ...queuerService,
        service
      };
    });
    
    // Seleccionar un servicio al azar para pruebas
    const randomIndex = Math.floor(Math.random() * combinedData.length);
    const selectedService = combinedData[randomIndex];
    
    printResult('Obtener servicios (enfoque alternativo)', true, {
      total: combinedData.length,
      selectedService
    });
    
    return { services: combinedData, selectedService };
  } catch (error) {
    printResult('Obtener servicios', false, error);
    throw error;
  }
}

/**
 * 6. Crear una reserva
 */
async function createReservation(serviceData) {
  try {
    log('6. Creando reserva...', colors.cyan);
    
    // Crear una fecha futura para la reserva (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const reservationData = {
      client_id: profileId,
      queuer_id: queuerProfileId,
      service_id: serviceData.selectedService.service_id,
      date: tomorrow.toISOString(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select();
    
    if (error) throw error;
    
    reservationId = data[0].id;
    
    printResult('Crear reserva', true, data);
    return data;
  } catch (error) {
    printResult('Crear reserva', false, error);
    throw error;
  }
}

/**
 * 7. Obtener reservas activas
 */
async function getActiveReservations() {
  try {
    log('7. Obteniendo reservas activas...', colors.cyan);
    
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        services:service_id(*),
        profiles:client_id(*),
        queuer:queuer_id(*)
      `)
      .eq('client_id', profileId)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    printResult('Obtener reservas activas', true, data);
    return data;
  } catch (error) {
    printResult('Obtener reservas activas', false, error);
    throw error;
  }
}

/**
 * 8. Cancelar reserva
 */
async function cancelReservation() {
  try {
    log('8. Cancelando reserva...', colors.cyan);
    
    const { data, error } = await supabase
      .from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select();
    
    if (error) throw error;
    
    printResult('Cancelar reserva', true, data);
    return data;
  } catch (error) {
    printResult('Cancelar reserva', false, error);
    throw error;
  }
}

/**
 * 9. Crear una reserva completada para valorarla
 */
async function createCompletedReservation(serviceData) {
  try {
    log('9. Creando reserva completada para valoración...', colors.cyan);
    
    // Crear una fecha pasada para la reserva (ayer)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    
    const reservationData = {
      client_id: profileId,
      queuer_id: queuerProfileId,
      service_id: serviceData.selectedService.service_id,
      date: yesterday.toISOString(),
      status: 'completed',
      created_at: new Date(yesterday).toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select();
    
    if (error) throw error;
    
    reservationId = data[0].id;
    
    printResult('Crear reserva completada', true, data);
    return data;
  } catch (error) {
    printResult('Crear reserva completada', false, error);
    throw error;
  }
}

/**
 * 10. Valorar una reserva completada
 */
async function rateReservation() {
  try {
    log('10. Valorando reserva...', colors.cyan);
    
    const rating = Math.floor(Math.random() * 5) + 1; // Valoración aleatoria entre 1 y 5
    
    const { data, error } = await supabase
      .from('reservations')
      .update({ 
        client_rating: rating,
        client_review: `Esta es una valoración de prueba con ${rating} estrellas.`,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select();
    
    if (error) throw error;
    
    printResult('Valorar reserva', true, data);
    return data;
  } catch (error) {
    printResult('Valorar reserva', false, error);
    throw error;
  }
}

/**
 * 11. Actualizar promedio de valoraciones del representante
 */
async function updateQueuerRating() {
  try {
    log('11. Actualizando promedio de valoraciones del representante...', colors.cyan);
    
    // 1. Obtener todas las valoraciones del representante
    const { data: ratings, error: ratingsError } = await supabase
      .from('reservations')
      .select('client_rating')
      .eq('queuer_id', queuerProfileId)
      .not('client_rating', 'is', null);
    
    if (ratingsError) throw ratingsError;
    
    if (ratings.length === 0) {
      log('El representante no tiene valoraciones', colors.yellow);
      return null;
    }
    
    // 2. Calcular la nueva valoración media
    const totalRating = ratings.reduce((sum, item) => sum + item.client_rating, 0);
    const averageRating = totalRating / ratings.length;
    
    // 3. Actualizar el perfil del representante
    const { data, error } = await supabase
      .from('profiles')
      .update({
        rating: averageRating,
        updated_at: new Date().toISOString()
      })
      .eq('id', queuerProfileId)
      .select();
    
    if (error) throw error;
    
    printResult('Actualizar valoración promedio', true, {
      totalRatings: ratings.length,
      averageRating,
      updatedProfile: data
    });
    return data;
  } catch (error) {
    printResult('Actualizar valoración promedio', false, error);
    throw error;
  }
}

/**
 * Crear servicios de prueba si no existen
 */
async function createTestServicesIfNeeded() {
  try {
    log('Verificando si existen servicios...', colors.cyan);
    
    // Verificar si hay servicios existentes
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) throw servicesError;
    
    // Si ya hay servicios, no es necesario crear más
    if (servicesData && servicesData.length > 0) {
      printResult('Verificación de servicios', true, { 
        message: `Ya existen ${servicesData.length} servicios en la base de datos` 
      });
      return servicesData;
    }
    
    log('No se encontraron servicios, creando servicios de prueba...', colors.yellow);
    
    // Lista de servicios de prueba para crear (sin updated_at ni created_at)
    const testServices = [
      {
        name: 'Trámite General',
        description: 'Servicio para realizar cualquier tipo de trámite general'
      },
      {
        name: 'Pago de Servicios',
        description: 'Representación para pago de servicios públicos y privados'
      },
      {
        name: 'Trámites Bancarios',
        description: 'Servicios relacionados con entidades bancarias y financieras'
      },
      {
        name: 'Gestiones Municipales',
        description: 'Representación en oficinas y dependencias municipales'
      },
      {
        name: 'Recogida de Documentos',
        description: 'Servicio de recogida y entrega de documentación importante'
      }
    ];
    
    // Insertar los servicios
    const { data: insertedServices, error: insertError } = await supabase
      .from('services')
      .insert(testServices)
      .select();
    
    if (insertError) throw insertError;
    
    printResult('Creación de servicios de prueba', true, insertedServices);
    return insertedServices;
  } catch (error) {
    printResult('Creación de servicios de prueba', false, error);
    throw new Error(`No se pudieron crear los servicios de prueba: ${error.message}`);
  }
}

/**
 * Asignar servicios a representantes
 */
async function assignServicesToQueuers() {
  try {
    log('Verificando asignaciones de servicios a representantes...', colors.cyan);
    
    // Obtener todos los servicios
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) throw servicesError;
    
    if (!services || services.length === 0) {
      throw new Error('No hay servicios disponibles para asignar');
    }
    
    // Obtener representantes
    const { data: queuers, error: queuersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'queuer');
    
    if (queuersError) throw queuersError;
    
    if (!queuers || queuers.length === 0) {
      throw new Error('No hay representantes disponibles para asignar servicios');
    }
    
    // Verificar asignaciones existentes
    const { data: existingAssignments, error: assignmentsError } = await supabase
      .from('queuer_services')
      .select('*');
    
    if (assignmentsError) throw assignmentsError;
    
    if (existingAssignments && existingAssignments.length > 0) {
      printResult('Verificación de asignaciones', true, { 
        message: `Ya existen ${existingAssignments.length} asignaciones de servicios` 
      });
      return existingAssignments;
    }
    
    log('No se encontraron asignaciones, creando asignaciones de prueba...', colors.yellow);
    
    // Crear asignaciones
    const assignments = [];
    
    // Para cada representante, asignar entre 2 y 4 servicios aleatorios
    for (const queuer of queuers) {
      // Mezclar los servicios para obtener una selección aleatoria
      const shuffledServices = [...services].sort(() => 0.5 - Math.random());
      const numServices = Math.floor(Math.random() * 3) + 2; // Entre 2 y 4 servicios
      const selectedServices = shuffledServices.slice(0, numServices);
      
      for (const service of selectedServices) {
        assignments.push({
          queuer_id: queuer.id,
          service_id: service.id,
          rate: Math.floor(Math.random() * 50) + 10 // Tarifa entre 10 y 60
        });
      }
    }
    
    // Insertar las asignaciones
    const { data: insertedAssignments, error: insertError } = await supabase
      .from('queuer_services')
      .insert(assignments)
      .select();
    
    if (insertError) throw insertError;
    
    printResult('Asignación de servicios a representantes', true, { 
      total: insertedAssignments.length,
      assignments: insertedAssignments.slice(0, 5) // Mostrar solo las primeras 5 para no saturar la consola
    });
    return insertedAssignments;
  } catch (error) {
    printResult('Asignación de servicios a representantes', false, error);
    throw new Error(`No se pudieron asignar servicios a representantes: ${error.message}`);
  }
}

/**
 * Ejecutar todas las pruebas en secuencia
 */
async function runTests() {
  try {
    log('Iniciando pruebas de funcionalidades del cliente...', colors.magenta);
    console.log('===========================================');
    
    // Verificar la conexión a Supabase
    await checkSupabaseCredentials();
    
    // Verificar/crear el usuario de prueba
    await createTestUserIfNeeded();
    
    // Ejecutar pruebas básicas del cliente
    log('Iniciando pruebas básicas del cliente...', colors.cyan);
    await loginAsClient();
    await getClientProfile();
    await updateClientProfile();
    
    // Intentar pruebas que requieren servicios y queuers
    try {
      const queuers = await searchQueuers();
      log('Se encontraron representantes, continuando con pruebas de reservas...', colors.green);
      
      try {
        const serviceData = await getQueuerServices();
        log('Se encontraron servicios asignados a representantes, continuando con pruebas completas...', colors.green);
        
        // Pruebas completas con reservas
        await createReservation(serviceData);
        await getActiveReservations();
        await cancelReservation();
        await createCompletedReservation(serviceData);
        await rateReservation();
        await updateQueuerRating();
      } catch (error) {
        log(`No se pudieron obtener servicios para los representantes: ${error.message}`, colors.yellow);
        log('Omitiendo pruebas que requieren servicios...', colors.yellow);
      }
    } catch (error) {
      log(`No se pudieron obtener representantes: ${error.message}`, colors.yellow);
      log('Omitiendo pruebas que requieren representantes y reservas...', colors.yellow);
    }
    
    log('¡Pruebas completadas!', colors.green);
    log('Nota: Si algunas pruebas fueron omitidas, revisa los mensajes anteriores.', colors.yellow);
  } catch (error) {
    log('Pruebas interrumpidas debido a un error.', colors.red, true);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar el script
runTests(); 