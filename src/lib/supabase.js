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

// Funciones de autenticación
export const signUp = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData, // datos adicionales como nombre, tipo de usuario, etc.
    },
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
};

// Funciones para manejar perfiles de usuario
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

// Función para obtener perfil por user_id (necesaria para el dashboard)
export const getProfileByUserId = async (userId) => {
  if (!userId) {
    console.error('Error: userId es requerido para obtener un perfil');
    return { data: null, error: { message: 'userId es requerido' } };
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Error al obtener perfil por user_id:', error);
    }
    
    return { data, error };
  } catch (err) {
    console.error('Excepción al obtener perfil:', err);
    return { data: null, error: err };
  }
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId);
  return { data, error };
};

export const createProfile = async (profileData) => {
  try {
    console.log('Creando perfil con datos:', profileData);
    
    // Asegurarse de que user_id está presente
    if (!profileData.user_id) {
      console.error('Error: user_id es requerido para crear un perfil');
      return { 
        data: null, 
        error: { message: 'user_id es requerido para crear un perfil' } 
      };
    }
    
    // Asegurarse de que los campos requeridos están presentes
    if (!profileData.name || !profileData.user_type) {
      console.error('Error: name y user_type son campos requeridos');
      return { 
        data: null, 
        error: { message: 'name y user_type son campos requeridos' } 
      };
    }
    
    // Intentar insertar directamente sin usar .select() primero
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([profileData]);
      
    if (insertError) {
      console.error('Error detallado de Supabase al crear perfil:', JSON.stringify(insertError, null, 2));
      return { data: null, error: insertError };
    }
    
    // Si la inserción fue exitosa, obtener el perfil recién creado
    const { data: selectData, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', profileData.user_id)
      .single();
      
    if (selectError) {
      console.error('Error al recuperar el perfil creado:', selectError);
      // Aún así, consideramos que la creación fue exitosa
      return { data: insertData, error: null };
    }
    
    console.log('Perfil creado exitosamente:', selectData);
    return { data: selectData, error: null };
  } catch (err) {
    console.error('Excepción al crear perfil:', err);
    return { data: null, error: { message: err.message || 'Error desconocido', details: err } };
  }
};

// Funciones para representantes (queuers)
export const getQueuers = async (filters = {}) => {
  let query = supabase.from('profiles').select('*').eq('user_type', 'queuer');
  
  // Aplicar filtros si existen
  if (filters.speciality) {
    query = query.ilike('speciality', `%${filters.speciality}%`);
  }
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.minRating) {
    query = query.gte('rating', filters.minRating);
  }
  
  const { data, error } = await query;
  return { data, error };
};

// Funciones para reservas
export const createReservation = async (reservationData) => {
  const { data, error } = await supabase
    .from('reservations')
    .insert([reservationData]);
  return { data, error };
};

export const getReservations = async (userId, userType) => {
  // Dependiendo del tipo de usuario, filtramos por cliente o representante
  const column = userType === 'client' ? 'client_id' : 'queuer_id';
  
  const { data, error } = await supabase
    .from('reservations')
    .select('*, profiles(*)')
    .eq(column, userId);
  return { data, error };
};

// Función para obtener reservas de un cliente (necesaria para el dashboard)
export const getClientReservations = async (clientId, status = null) => {
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
};

export const updateReservationStatus = async (reservationId, status, updates = {}) => {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status, ...updates })
    .eq('id', reservationId);
  return { data, error };
}; 