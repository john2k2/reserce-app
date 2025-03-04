/**
 * Script para crear servicios y asignarlos a los representantes
 * 
 * Este script:
 * 1. Crea servicios predefinidos si no existen
 * 2. Asigna servicios a todos los representantes que no tienen servicios
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

/**
 * Imprimir mensaje coloreado
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Verificar y crear servicios
 */
async function createServices() {
  log('1. Verificando si existen servicios...', colors.cyan);
  
  // Comprobar servicios existentes
  const { data: existingServices, error: servicesError } = await supabase
    .from('services')
    .select('*');
  
  if (servicesError) {
    log(`Error al consultar servicios: ${servicesError.message}`, colors.red);
    throw servicesError;
  }
  
  if (existingServices && existingServices.length > 0) {
    log(`Existen ${existingServices.length} servicios en la base de datos:`, colors.green);
    existingServices.forEach((service, index) => {
      log(`  ${index + 1}. ${service.name} (${service.id})`, colors.green);
    });
    return existingServices;
  }
  
  log('No se encontraron servicios. Creando servicios predefinidos...', colors.yellow);
  
  // Servicios a crear
  const servicesToCreate = [
    { name: 'Trámite General', description: 'Servicio para realizar cualquier tipo de trámite general' },
    { name: 'Pago de Servicios', description: 'Representación para pago de servicios públicos y privados' },
    { name: 'Trámites Bancarios', description: 'Servicios relacionados con entidades bancarias y financieras' },
    { name: 'Gestiones Municipales', description: 'Representación en oficinas y dependencias municipales' },
    { name: 'Recogida de Documentos', description: 'Servicio de recogida y entrega de documentación importante' }
  ];
  
  try {
    const { data: createdServices, error: createError } = await supabase
      .from('services')
      .insert(servicesToCreate)
      .select();
    
    if (createError) {
      log('Error al crear servicios. Verificando si tienes permisos...', colors.red);
      
      // Intentar una alternativa: verificar permisos usando el usuario autenticado
      log('Intento 2: Tratando de autenticar primero...', colors.yellow);
      
      // Para crear servicios, necesitamos autenticarnos como administrador
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@ejemplo.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (authError) {
        log(`No se pudo autenticar como administrador: ${authError.message}`, colors.red);
        log('Por favor, crea los servicios manualmente desde el panel de Supabase:', colors.yellow);
        servicesToCreate.forEach((service, index) => {
          log(`  ${index + 1}. ${service.name}: ${service.description}`, colors.yellow);
        });
        return null;
      }
      
      // Intentar crear los servicios de nuevo como administrador autenticado
      const { data: servicesAfterAuth, error: errorAfterAuth } = await supabase
        .from('services')
        .insert(servicesToCreate)
        .select();
      
      if (errorAfterAuth) {
        log(`Aún no se pueden crear servicios: ${errorAfterAuth.message}`, colors.red);
        log('Por favor, crea los servicios manualmente desde el panel de Supabase.', colors.yellow);
        return null;
      }
      
      log(`Se crearon ${servicesAfterAuth.length} servicios como administrador:`, colors.green);
      servicesAfterAuth.forEach((service, index) => {
        log(`  ${index + 1}. ${service.name} (${service.id})`, colors.green);
      });
      
      return servicesAfterAuth;
    }
    
    log(`Se crearon ${createdServices.length} servicios:`, colors.green);
    createdServices.forEach((service, index) => {
      log(`  ${index + 1}. ${service.name} (${service.id})`, colors.green);
    });
    
    return createdServices;
  } catch (error) {
    log(`Error inesperado al crear servicios: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Obtener representantes sin servicios asignados
 */
async function getQueuersWithoutServices() {
  log('2. Buscando representantes sin servicios asignados...', colors.cyan);
  
  // Obtener todos los representantes
  const { data: queuers, error: queuersError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'queuer');
  
  if (queuersError) {
    log(`Error al obtener representantes: ${queuersError.message}`, colors.red);
    throw queuersError;
  }
  
  if (!queuers || queuers.length === 0) {
    log('No se encontraron representantes en la base de datos.', colors.yellow);
    return [];
  }
  
  log(`Se encontraron ${queuers.length} representantes:`, colors.green);
  queuers.forEach((queuer, index) => {
    log(`  ${index + 1}. ${queuer.name || 'Sin nombre'} (${queuer.id})`, colors.green);
  });
  
  // Obtener asignaciones existentes
  const { data: existingAssignments, error: assignmentsError } = await supabase
    .from('queuer_services')
    .select('*');
  
  if (assignmentsError) {
    log(`Error al obtener asignaciones existentes: ${assignmentsError.message}`, colors.red);
    throw assignmentsError;
  }
  
  // Identificar queuers sin servicios
  const queuersWithServices = new Set(existingAssignments?.map(a => a.queuer_id) || []);
  const queuersWithoutServices = queuers.filter(q => !queuersWithServices.has(q.id));
  
  if (queuersWithoutServices.length === 0) {
    log('Todos los representantes ya tienen servicios asignados.', colors.green);
    return [];
  }
  
  log(`Se encontraron ${queuersWithoutServices.length} representantes sin servicios:`, colors.yellow);
  queuersWithoutServices.forEach((queuer, index) => {
    log(`  ${index + 1}. ${queuer.name || 'Sin nombre'} (${queuer.id})`, colors.yellow);
  });
  
  return queuersWithoutServices;
}

/**
 * Asignar servicios a representantes
 */
async function assignServicesToQueuers(services, queuersWithoutServices) {
  if (!services || services.length === 0 || !queuersWithoutServices || queuersWithoutServices.length === 0) {
    log('No hay servicios o representantes para asignar.', colors.yellow);
    return;
  }
  
  log('3. Asignando servicios a representantes...', colors.cyan);
  
  const assignments = [];
  
  // Para cada representante, asignar entre 2 y 4 servicios aleatorios
  for (const queuer of queuersWithoutServices) {
    // Mezclar los servicios para obtener una selección aleatoria
    const shuffledServices = [...services].sort(() => 0.5 - Math.random());
    const numServices = Math.floor(Math.random() * 3) + 2; // Entre 2 y 4 servicios
    const selectedServices = shuffledServices.slice(0, numServices);
    
    log(`Asignando ${selectedServices.length} servicios a ${queuer.name || queuer.id}...`, colors.blue);
    
    for (const service of selectedServices) {
      assignments.push({
        queuer_id: queuer.id,
        service_id: service.id,
        rate: Math.floor(Math.random() * 50) + 10 // Tarifa entre 10 y 60
      });
    }
  }
  
  if (assignments.length === 0) {
    log('No se generaron asignaciones para crear.', colors.yellow);
    return;
  }
  
  try {
    // Insertar las asignaciones
    const { data: insertedAssignments, error: insertError } = await supabase
      .from('queuer_services')
      .insert(assignments)
      .select();
    
    if (insertError) {
      log(`Error al asignar servicios: ${insertError.message}`, colors.red);
      
      // Verificar si es un problema de permisos e intentar con usuario autenticado
      log('Intentando asignar servicios con autenticación...', colors.yellow);
      
      // Para esto necesitamos estar autenticados como un usuario con permisos
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@ejemplo.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (authError) {
        log(`No se pudo autenticar: ${authError.message}`, colors.red);
        log('Por favor, asigna los servicios manualmente desde el panel de Supabase.', colors.yellow);
        return;
      }
      
      // Intentar asignar servicios de nuevo como usuario autenticado
      const { data: assignmentsAfterAuth, error: errorAfterAuth } = await supabase
        .from('queuer_services')
        .insert(assignments)
        .select();
      
      if (errorAfterAuth) {
        log(`Aún no se pueden asignar servicios: ${errorAfterAuth.message}`, colors.red);
        log('Por favor, asigna los servicios manualmente desde el panel de Supabase.', colors.yellow);
        assignments.forEach((assignment, index) => {
          log(`  - Asignar servicio ${assignment.service_id} al representante ${assignment.queuer_id} con tarifa ${assignment.rate}`, colors.yellow);
        });
        return;
      }
      
      log(`Se asignaron ${assignmentsAfterAuth.length} servicios a ${queuersWithoutServices.length} representantes.`, colors.green);
      return;
    }
    
    log(`Se asignaron ${insertedAssignments.length} servicios a ${queuersWithoutServices.length} representantes:`, colors.green);
    queuersWithoutServices.forEach((queuer) => {
      const queuerAssignments = insertedAssignments.filter(a => a.queuer_id === queuer.id);
      log(`  - ${queuer.name || queuer.id}: ${queuerAssignments.length} servicios asignados`, colors.green);
    });
  } catch (error) {
    log(`Error inesperado al asignar servicios: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  log('===================================================', colors.magenta);
  log('Creación de Servicios y Asignación a Representantes', colors.magenta);
  log('===================================================', colors.magenta);
  
  try {
    // 1. Crear servicios si no existen
    const services = await createServices();
    
    // 2. Obtener representantes sin servicios
    const queuersWithoutServices = await getQueuersWithoutServices();
    
    // 3. Asignar servicios a representantes
    await assignServicesToQueuers(services, queuersWithoutServices);
    
    log('\n¡Proceso completado!', colors.green);
    log('Ahora puedes ejecutar las pruebas completas con:', colors.cyan);
    log('node src/scripts/test-client-features.js', colors.cyan);
  } catch (error) {
    log(`\nError en el proceso: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Ejecutar el script
main(); 