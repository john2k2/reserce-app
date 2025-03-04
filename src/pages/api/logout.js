import { signOut } from '../../lib/supabase.ts';

// Endpoint para cerrar sesión
export const POST = async ({ request }) => {
  return handleLogout();
};

// También manejar solicitudes GET para permitir enlaces directos
export const GET = async ({ request }) => {
  return handleLogout();
};

// Función común para manejar el cierre de sesión
async function handleLogout() {
  try {
    const { error } = await signOut();
    
    if (error) {
      console.error('Error al cerrar sesión:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al cerrar sesión. Por favor, inténtalo de nuevo.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Redirigir a la página de inicio después de cerrar sesión
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
      },
    });
    
  } catch (error) {
    console.error('Error en el endpoint de cierre de sesión:', error);
    
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