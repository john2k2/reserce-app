import { signIn } from '../../lib/supabase.ts';

// Endpoint para manejar el inicio de sesión
export const POST = async ({ request }) => {
  try {
    console.log('Procesando solicitud de inicio de sesión...');
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
    
    if (!data || !data.user || !data.session) {
      console.error('Sesión o usuario no disponible en la respuesta');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al iniciar sesión. No se pudo crear la sesión.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Establecer la cookie para asegurar que la sesión persista entre navegación
    const cookieOptions = [
      `sb-access-token=${data.session.access_token}`,
      `path=/`,
      `max-age=${60 * 60 * 24 * 7}`, // 7 días
      `SameSite=Lax`
    ];
    
    // Verificar si estamos en un entorno seguro para añadir la bandera Secure
    // En producción, esto dependerá de tu configuración de despliegue
    const isSecure = request.headers.get('x-forwarded-proto') === 'https' || 
                     request.url.startsWith('https://');
    
    if (isSecure) {
      cookieOptions.push('Secure');
    }
    
    // Inicio de sesión exitoso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inicio de sesión exitoso',
        user: {
          id: data.user.id,
          email: data.user.email,
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
          'Set-Cookie': cookieOptions.join('; ')
        },
      }
    );
    
  } catch (error) {
    console.error('Error en el endpoint de login:', error);
    
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