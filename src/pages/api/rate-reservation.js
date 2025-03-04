import { getSession, supabase } from '../../lib/supabase.ts';

export async function post({ request }) {
  // Verificar autenticación
  const { data: sessionData, error: sessionError } = await getSession();
  
  if (sessionError || !sessionData?.session) {
    return new Response(
      JSON.stringify({
        error: 'No autorizado. Debes iniciar sesión para valorar una reserva.'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  const userId = sessionData.session.user.id;
  
  try {
    // Obtener datos de la valoración
    const body = await request.json();
    const { reservationId, rating, review } = body;
    
    if (!reservationId) {
      return new Response(
        JSON.stringify({
          error: 'Se requiere el ID de la reserva'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({
          error: 'La valoración debe ser un número entre 1 y 5'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Verificar que la reserva existe y pertenece al usuario
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, client_id, queuer_id, status, profiles(id, user_id)')
      .eq('id', reservationId)
      .single();
    
    if (reservationError || !reservation) {
      return new Response(
        JSON.stringify({
          error: 'Reserva no encontrada'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Verificar que el usuario es el cliente de la reserva
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!profile || profile.id !== reservation.client_id) {
      return new Response(
        JSON.stringify({
          error: 'No tienes permiso para valorar esta reserva'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Verificar que la reserva está completada
    if (reservation.status !== 'completed') {
      return new Response(
        JSON.stringify({
          error: 'Solo se pueden valorar reservas completadas'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Actualizar la reserva con la valoración
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        client_rating: rating,
        client_review: review || null
      })
      .eq('id', reservationId);
    
    if (updateError) {
      throw new Error(`Error al actualizar la valoración: ${updateError.message}`);
    }
    
    // Actualizar la valoración media del representante
    // 1. Obtener todas las valoraciones del representante
    const { data: ratings, error: ratingsError } = await supabase
      .from('reservations')
      .select('client_rating')
      .eq('queuer_id', reservation.queuer_id)
      .not('client_rating', 'is', null);
    
    if (!ratingsError && ratings && ratings.length > 0) {
      // 2. Calcular la nueva valoración media
      const totalRating = ratings.reduce((sum, item) => sum + item.client_rating, 0);
      const averageRating = totalRating / ratings.length;
      
      // 3. Actualizar el perfil del representante
      await supabase
        .from('profiles')
        .update({
          rating: averageRating,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservation.queuer_id);
    }
    
    // Añadir notificación para el representante
    await supabase
      .from('notifications')
      .insert({
        user_id: reservation.profiles.user_id, // ID de usuario del representante
        title: 'Nueva valoración recibida',
        content: `Has recibido una valoración de ${rating} estrellas para una reserva completada.`,
        is_read: false,
        related_id: reservationId,
        related_type: 'reservation'
      });
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valoración enviada correctamente'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error en rate-reservation:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al procesar la valoración'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 