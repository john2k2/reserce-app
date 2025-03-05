import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_KEY;

// Create a standard client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a service role client for server-side operations (with admin privileges)
// IMPORTANT: This client should ONLY be used on the server-side (in API routes)
// and NEVER exposed to the client
// If service key is not available, fall back to anon key (but with limited permissions)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase;

// User Authentication

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, userData: any = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
    },
  });
  
  return { data, error };
}

/**
 * Sign in a user with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Obtiene la sesión actual del usuario
 * @returns Objeto con los datos de la sesión
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error al obtener la sesión:', error);
      return { data: null, error };
    }
    
    // Guardar estado de la sesión en una cookie para que persista
    if (data.session) {
      // No exponemos el token completo, solo un indicador de que el usuario está autenticado
      return { 
        data: {
          session: {
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              user_metadata: data.session.user.user_metadata
            }
          }
        }, 
        error: null 
      };
    }
    
    return { data, error: null };
  } catch (e) {
    console.error('Error inesperado al obtener la sesión:', e);
    return { data: null, error: e };
  }
}

/**
 * Verifica si el usuario está autenticado
 * @returns Booleano indicando si está autenticado
 */
export async function isAuthenticated() {
  const { data } = await getSession();
  return !!data?.session;
}

/**
 * Obtiene el usuario actual
 * @returns Datos del usuario actual
 */
export async function getCurrentUser() {
  const { data } = await getSession();
  return data?.session?.user || null;
}

// Profile Management

/**
 * Get profile by user ID
 */
export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
}

/**
 * Get profile by profile ID
 */
export async function getProfileById(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();
  
  return { data, error };
}

/**
 * Create a profile for a user
 */
export async function createProfile(profileData: any) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single();
  
  return { data, error };
}

/**
 * Update a user's profile
 */
export async function updateProfile(profileId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();
  
  return { data, error };
}

// Reservation Management

/**
 * Create a new reservation
 */
export async function createReservation(reservationData: any) {
  const { data, error } = await supabase
    .from('reservations')
    .insert([{
      ...reservationData,
      created_at: new Date().toISOString(),
      status: reservationData.status || 'pending',
    }])
    .select()
    .single();
  
  return { data, error };
}

/**
 * Update a reservation's status
 */
export async function updateReservationStatus(reservationId: string, status: string, additionalData: any = {}) {
  const { data, error } = await supabase
    .from('reservations')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...additionalData,
    })
    .eq('id', reservationId)
    .select()
    .single();
  
  return { data, error };
}

/**
 * Get reservations for a client
 */
export async function getClientReservations(clientId: string | null | undefined, status: string | string[] | null = null) {
  // Si el clientId es null o undefined, retornar un arreglo vacío
  if (!clientId) {
    return { data: [], error: null };
  }
  
  let query = supabase
    .from('reservations')
    .select(`
      *,
      profiles!reservations_queuer_id_fkey(id, name, avatar_url, rating),
      services(id, name, description)
    `)
    .eq('client_id', clientId);
  
  if (status) {
    if (Array.isArray(status)) {
      query = query.in('status', status);
    } else {
      query = query.eq('status', status);
    }
  }
  
  query = query.order('date', { ascending: false });
  
  const { data, error } = await query;
  
  return { data, error };
}

/**
 * Get reservations for a queuer
 */
export async function getQueuerReservations(queuer_id: string, statuses: string[]) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        profiles!reservations_client_id_fkey(*),
        services(*)
      `)
      .eq('queuer_id', queuer_id)
      .in('status', statuses)
      .order('date', { ascending: false });
    
    return { data, error };
  } catch (e) {
    console.error('Error al obtener reservas del representante:', e);
    return { data: null, error: e };
  }
}

/**
 * Get a specific reservation by ID
 */
export async function getReservationById(reservationId: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      profiles!reservations_client_id_fkey(id, name, avatar_url),
      profiles!reservations_queuer_id_fkey(id, name, avatar_url, rating),
      services(id, name, description)
    `)
    .eq('id', reservationId)
    .single();
  
  return { data, error };
}

// Notification Management

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();
  
  return { data, error };
}

/**
 * Create a notification
 */
export async function createNotification(notificationData: any) {
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      ...notificationData,
      read: false,
      created_at: new Date().toISOString(),
    }])
    .select()
    .single();
  
  return { data, error };
}

// Services Management

/**
 * Get all available services
 */
export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');
  
  return { data, error };
}

/**
 * Get a service by ID or code
 */
export async function getServiceById(serviceIdOrCode: string) {
  try {
    // Verificar si el parámetro es un UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(serviceIdOrCode);
    
    let query;
    
    if (isUUID) {
      // Si es un UUID, buscar directamente por ID
      query = supabase
        .from('services')
        .select('*')
        .eq('id', serviceIdOrCode)
        .single();
    } else {
      // Si es un código simple, buscar por código
      query = supabase
        .from('services')
        .select('*')
        .eq('code', serviceIdOrCode)
        .single();
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error al obtener servicio por ${isUUID ? 'UUID' : 'código'}:`, error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (e) {
    console.error('Error inesperado al obtener servicio:', e);
    return { data: null, error: e };
  }
}

/**
 * Get all available services for filtering
 */
export async function getAllQueuerServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, code, category')
      .order('name');
    if (error) {
      throw error;
    }
    return { data, error: null };
  } catch (e) {
    console.error('Error al obtener todos los servicios:', e);
    return { data: null, error: e };
  }
}

/**
 * Get a service specifically by its code
 */
export async function getServiceByCode(code: string) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) {
      console.error('Error al obtener servicio por código:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (e) {
    console.error('Error inesperado al obtener servicio por código:', e);
    return { data: null, error: e };
  }
}

// Queuer Management

/**
 * Obtiene los representantes activos con filtros opcionales
 */
export async function getQueuers(filters: {
  active?: boolean;
  search?: string;
  city?: string;
  service?: string;
  minRating?: number;
  sortBy?: string;
}) {
  try {
    // Construir consulta base
    let query = supabase
      .from('profiles')
      .select(`
        id,
        name,
        avatar_url,
        rating,
        completed_queues,
        city,
        rate_per_hour,
        speciality,
        is_verified
      `)
      .eq('user_type', 'queuer');
    
    // Aplicar filtro de activo si está presente
    if (filters.active !== undefined) {
      query = query.eq('is_active', filters.active);
    }
    
    // Aplicar filtro de búsqueda
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%, speciality.ilike.%${filters.search}%`);
    }
    
    // Aplicar filtro de ciudad
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    
    // Aplicar filtro de calificación mínima
    if (filters.minRating) {
      query = query.gte('rating', filters.minRating);
    }
    
    // Si hay filtro por servicio, necesitamos un enfoque diferente
    if (filters.service) {
      // Obtener todos los queuers que ofrecen este servicio
      const { data: queuerServices, error: queuerServicesError } = await supabase
        .from('queuer_services')
        .select('queuer_id')
        .eq('service_id', filters.service);
      
      if (queuerServicesError) throw queuerServicesError;
      
      if (queuerServices && queuerServices.length > 0) {
        // Extraer los IDs de los representantes
        const queuerIds = queuerServices.map(qs => qs.queuer_id);
        query = query.in('id', queuerIds);
      } else {
        // Si no hay representantes para este servicio, retornar lista vacía
        return { data: [], error: null };
      }
    }
    
    // Aplicar ordenamiento
    switch (filters.sortBy) {
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      case 'completed':
        query = query.order('completed_queues', { ascending: false });
        break;
      case 'price_low':
        // Ordenar por precio ascendente (menor a mayor)
        query = query.order('rate_per_hour', { ascending: true });
        // Ordenar por calificación como segundo criterio para agrupar los nulos al final 
        query = query.order('rating', { ascending: false });
        break;
      case 'price_high':
        query = query.order('rate_per_hour', { ascending: false });
        break;
      case 'name':
        query = query.order('name');
        break;
      default:
        query = query.order('rating', { ascending: false });
    }
    
    // Ejecutar la consulta
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Ordenamiento manual para asegurarnos que los nulos queden al final en 'price_low'
    if (filters.sortBy === 'price_low' && data) {
      data.sort((a, b) => {
        // Si ambos tienen rate_per_hour, mantener el orden ascendente
        if (a.rate_per_hour !== null && b.rate_per_hour !== null) {
          return a.rate_per_hour - b.rate_per_hour;
        }
        // Si solo a es null, ponerlo al final
        if (a.rate_per_hour === null && b.rate_per_hour !== null) {
          return 1;
        }
        // Si solo b es null, ponerlo al final
        if (a.rate_per_hour !== null && b.rate_per_hour === null) {
          return -1;
        }
        // Si ambos son null, ordenar por rating descendente
        return (b.rating || 0) - (a.rating || 0);
      });
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener representantes:', error);
    return { data: [], error };
  }
}

/**
 * Get available cities for queuers
 */
export async function getQueuerCities() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('city')
      .eq('user_type', 'queuer')
      .not('city', 'is', null)
      .order('city');
    
    if (error) throw error;
    
    // Convertir el array de objetos a un array de strings y eliminar duplicados
    const cities = [...new Set(data.map(item => item.city).filter(Boolean))];
    return { data: cities, error: null };
  } catch (error) {
    console.error('Error al obtener ciudades:', error);
    return { data: [], error };
  }
}

/**
 * Get queuer services
 */
export async function getQueuerServices(queuer_id: string) {
  try {
    const { data, error } = await supabase
      .from('queuer_services')
      .select(`
        *,
        services(*)
      `)
      .eq('queuer_id', queuer_id);
    
    return { data, error };
  } catch (e) {
    console.error('Error al obtener servicios del representante:', e);
    return { data: null, error: e };
  }
}

/**
 * Get queuers by service
 */
export async function getQueuersByService(serviceId: string) {
  const { data: queuerServices, error: queuerServicesError } = await supabase
    .from('queuer_services')
    .select('queuer_id')
    .eq('service_id', serviceId);
  
  if (queuerServicesError || !queuerServices || queuerServices.length === 0) {
    return { data: [], error: queuerServicesError };
  }
  
  const queuerIds = queuerServices.map(qs => qs.queuer_id);
  
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      avatar_url,
      rating,
      completed_queues,
      city,
      rate_per_hour,
      speciality,
      is_verified
    `)
    .eq('user_type', 'queuer')
    .eq('is_active', true)
    .in('id', queuerIds)
    .order('rating', { ascending: false });
  
  return { data, error };
}