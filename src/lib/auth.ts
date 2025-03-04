import { supabase } from './supabase';

/**
 * Get the current session for server-side rendering in Astro components
 * @returns The current session data or null
 */
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error getting session:', err);
    return { data: null, error: err };
  }
}

/**
 * Get the current user for server-side rendering in Astro components
 * @returns The current user data or null
 */
export async function getCurrentUser() {
  try {
    const { data: sessionData } = await getSession();
    if (!sessionData?.session) {
      return { data: null, error: null };
    }
    
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting user:', error.message);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error getting user:', err);
    return { data: null, error: err };
  }
} 