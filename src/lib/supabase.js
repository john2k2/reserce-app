import { createClient } from '@supabase/supabase-js';

// Estas variables deberían estar en un archivo .env
// Para desarrollo, podemos dejarlas aquí temporalmente
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
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

export const updateReservationStatus = async (reservationId, status, updates = {}) => {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status, ...updates })
    .eq('id', reservationId);
  return { data, error };
}; 