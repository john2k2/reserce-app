import { getSession, getProfileByUserId } from '../../lib/supabase';

// Endpoint para verificar el estado de autenticación del usuario
export async function get({ request }) {
  try {
    // Obtener la sesión actual
    const { data: sessionData, error: sessionError } = await getSession();
    
    if (sessionError || !sessionData.session) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          message: 'No hay una sesión activa',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await getProfileByUserId(sessionData.session.user.id);
    
    if (profileError) {
      console.error('Error al obtener el perfil:', profileError);
      
      return new Response(
        JSON.stringify({
          authenticated: true,
          hasProfile: false,
          message: 'No se pudo cargar el perfil del usuario',
          user: {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        authenticated: true,
        hasProfile: !!profile,
        message: 'Usuario autenticado',
        user: {
          id: sessionData.session.user.id,
          email: sessionData.session.user.email,
          profile: profile || null,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error en el endpoint de estado de autenticación:', error);
    
    return new Response(
      JSON.stringify({
        authenticated: false,
        message: 'Error al verificar el estado de autenticación',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 