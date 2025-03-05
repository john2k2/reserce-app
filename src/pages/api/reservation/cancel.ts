import { supabase, supabaseAdmin } from '../../../lib/supabase';
import type { APIContext } from 'astro';

export const POST = async ({ request }: APIContext) => {
  try {
    // Obtener ID de la reserva
    const data = await request.json();
    const { reservationId } = data;
    
    if (!reservationId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de reserva no proporcionado',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Intentando cancelar reserva con ID:', reservationId);
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Debes iniciar sesión para cancelar una reserva',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuario autenticado:', session.user.id);

    // Obtener el perfil del usuario actual
    const userId = session.user.id;
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_type, is_admin')
      .eq('user_id', userId)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Error al obtener perfil del usuario:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo verificar tu perfil',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Perfil de usuario encontrado:', userProfile);

    // Primero verificar si la reserva existe
    const { data: checkReservation, error: checkError } = await supabaseAdmin
      .from('reservations')
      .select('id, status, client_id, queuer_id')
      .eq('id', reservationId)
      .single();
    
    if (checkError) {
      console.error('Error al verificar la reserva:', checkError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error al verificar la reserva: ${checkError.message}`,
          error: checkError
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!checkReservation) {
      console.error('Reserva no encontrada con ID:', reservationId);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Reserva no encontrada'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Reserva encontrada:', checkReservation);
    
    // Verificar que el usuario tenga permiso para cancelar esta reserva
    const isAdmin = !!userProfile.is_admin;
    const isClient = userProfile.id === checkReservation.client_id;
    const isQueuer = userProfile.id === checkReservation.queuer_id;
    
    console.log('Verificación de permisos:', { 
      isAdmin, 
      isClient, 
      isQueuer, 
      userProfileId: userProfile.id, 
      reservationClientId: checkReservation.client_id 
    });
    
    // Solo el cliente, el representante o un administrador pueden cancelar la reserva
    if (!isClient && !isQueuer && !isAdmin) {
      console.error('Usuario sin permiso para cancelar esta reserva');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No tienes permiso para cancelar esta reserva',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Actualizar directamente el estado de la reserva a 'cancelled'
    console.log('Intentando actualizar reserva a cancelled...');
    
    // Usar supabaseAdmin para asegurar que tiene permisos suficientes
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select();
    
    if (updateError) {
      console.error('Error al cancelar la reserva:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error al cancelar la reserva: ${updateError.message}`,
          error: updateError
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!updateResult || updateResult.length === 0) {
      console.error('No se pudo actualizar la reserva. Resultado vacío.');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo cancelar la reserva. Verifica que el ID sea correcto.',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Reserva cancelada con éxito:', updateResult);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reserva cancelada con éxito',
        data: updateResult[0]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error en el endpoint de cancelación:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Función auxiliar para verificar si un usuario es administrador
async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single();
    
  if (error || !data) return false;
  return !!data.is_admin;
} 