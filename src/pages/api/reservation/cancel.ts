import { getSession, supabase } from '../../../lib/supabase';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  // Verificar la sesión del usuario
  const { data: sessionData, error: sessionError } = await getSession();
  
  if (sessionError || !sessionData?.session) {
    return new Response(
      JSON.stringify({
        error: 'No autorizado. Debe iniciar sesión para realizar esta acción.'
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    // Obtener el ID de reserva del cuerpo de la solicitud
    const { reservationId } = await request.json();
    
    if (!reservationId) {
      return new Response(
        JSON.stringify({ error: 'ID de reserva no proporcionado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener el perfil del usuario para verificar propiedad
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', sessionData.session.user.id)
      .single();
      
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'No se pudo encontrar su perfil' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar que la reserva pertenece al usuario
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, status, client_id')
      .eq('id', reservationId)
      .single();
    
    if (reservationError || !reservation) {
      return new Response(
        JSON.stringify({ error: 'Reserva no encontrada' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar que el usuario es dueño de esta reserva
    if (reservation.client_id !== profile.id) {
      return new Response(
        JSON.stringify({ error: 'No autorizado para cancelar esta reserva' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar que la reserva esté en un estado que permita cancelación
    if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ 
          error: 'Esta reserva no puede ser cancelada en su estado actual' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Actualizar el estado de la reserva a 'cancelled'
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);
    
    if (updateError) {
      console.error('Error al cancelar reserva:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al cancelar la reserva' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Respuesta exitosa
    return new Response(
      JSON.stringify({ success: true, message: 'Reserva cancelada correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en el endpoint de cancelación:', error);
    return new Response(
      JSON.stringify({ error: 'Error en el servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 