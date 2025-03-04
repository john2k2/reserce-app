import { signOut } from '../../lib/supabase.ts';

// Endpoint para cerrar sesión
export const POST = async ({ request }) => {
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
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sesión cerrada correctamente',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
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