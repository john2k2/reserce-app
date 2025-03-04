import { getSession, updateReservationStatus } from '../../lib/supabase.ts';

export async function post({ request }) {
  // Verificar autenticación
  const { data: sessionData, error: sessionError } = await getSession();
  
  if (sessionError || !sessionData?.session) {
    return new Response(
      JSON.stringify({
        error: 'No autorizado. Debes iniciar sesión para actualizar una reserva.'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  try {
    // Obtener datos para la actualización
    const body = await request.json();
    const { id, status, additionalData } = body;
    
    if (!id || !status) {
      return new Response(
        JSON.stringify({
          error: 'Se requieren los campos id y status'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Validar status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({
          error: 'Estado no válido. Debe ser: pending, confirmed, in_progress, completed, o cancelled'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Verificar que el usuario tiene permiso para actualizar esta reserva
    const userId = sessionData.session.user.id;
    
    // Obtener perfil del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, user_type, is_admin')
      .eq('user_id', userId)
      .single();
    
    if (!profile) {
      return new Response(
        JSON.stringify({
          error: 'No se encontró el perfil del usuario'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Obtener la reserva
    const { data: reservation } = await supabase
      .from('reservations')
      .select('client_id, queuer_id, status')
      .eq('id', id)
      .single();
    
    if (!reservation) {
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
    
    // Comprobar permisos según el rol
    let hasPermission = false;
    
    // Administradores pueden modificar cualquier reserva
    if (profile.is_admin) {
      hasPermission = true;
    }
    // Clientes solo pueden cancelar sus propias reservas que estén pendientes
    else if (profile.user_type === 'client' && profile.id === reservation.client_id) {
      if (status === 'cancelled' && reservation.status === 'pending') {
        hasPermission = true;
      } else {
        return new Response(
          JSON.stringify({
            error: 'Como cliente, solo puedes cancelar reservas pendientes'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }
    // Representantes pueden actualizar las reservas que les pertenecen
    else if (profile.user_type === 'queuer' && profile.id === reservation.queuer_id) {
      hasPermission = true;
      
      // Verificar transiciones válidas para representantes
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [], // No se puede cambiar una vez completada
        'cancelled': [] // No se puede reactivar una cancelada
      };
      
      if (!validTransitions[reservation.status].includes(status)) {
        return new Response(
          JSON.stringify({
            error: `No puedes cambiar una reserva desde "${reservation.status}" a "${status}"`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({
          error: 'No tienes permiso para actualizar esta reserva'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Actualizar el estado de la reserva
    const { data, error } = await updateReservationStatus(id, status, additionalData || {});
    
    if (error) {
      throw new Error(`Error al actualizar la reserva: ${error.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Estado de reserva actualizado correctamente',
        data
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error en update-reservation-status:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al actualizar el estado de la reserva'
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