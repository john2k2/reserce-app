import { signIn } from '../../lib/supabase';

// Endpoint para manejar el inicio de sesión
export async function post({ request }) {
  try {
    const body = await request.json();

    // Validar los campos requeridos
    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email y contraseña son requeridos.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Extraer credenciales
    const { email, password } = body;
    
    // Iniciar sesión con Supabase Auth
    const { data, error } = await signIn(email, password);
    
    if (error) {
      console.error('Error de autenticación:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Error al iniciar sesión. Verifica tus credenciales.',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Inicio de sesión exitoso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inicio de sesión exitoso',
        user: {
          id: data.user.id,
          email: data.user.email,
          // Si necesitas más datos del usuario, podrías hacer una consulta adicional
          // a la tabla de perfiles para obtener información como el tipo de usuario
        },
        session: {
          access_token: data.session.access_token,
          expires_at: data.session.expires_at,
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
    console.error('Error en el endpoint de inicio de sesión:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
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