import { getSession, updateProfile } from '../../lib/supabase';

// Endpoint para actualizar el perfil del usuario
export async function patch({ request }) {
  try {
    // Verificar si el usuario está autenticado
    const { data: sessionData, error: sessionError } = await getSession();
    
    if (sessionError || !sessionData.session) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No hay una sesión activa. Por favor, inicie sesión.',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Obtener los datos enviados
    const body = await request.json();
    
    // Verificar que se proporcione el ID del perfil
    if (!body.id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Es necesario proporcionar el ID del perfil.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Preparar los datos para actualizar
    const updates = { ...body };
    
    // Eliminar campos que no se deben actualizar
    delete updates.id; // El ID se usa para la consulta, no para la actualización
    delete updates.user_id; // No permitimos cambiar el ID de usuario
    delete updates.user_type; // No permitimos cambiar el tipo de usuario
    delete updates.created_at; // No permitimos cambiar la fecha de creación
    delete updates.is_admin; // No permitimos cambiar el estado de administrador
    delete updates.is_verified; // La verificación se hace por procesos admin
    delete updates.rating; // El rating se actualiza a través de reseñas
    delete updates.completed_queues; // Se actualiza automáticamente al completar reservas
    
    // Actualizar el perfil usando la función helper
    const { data, error } = await updateProfile(body.id, updates);
    
    if (error) {
      console.error('Error al actualizar el perfil:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Error al actualizar el perfil. Por favor, inténtalo de nuevo.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Actualización exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Perfil actualizado correctamente',
        profile: data,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error en el endpoint de actualización de perfil:', error);
    
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