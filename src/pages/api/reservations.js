import { supabase } from '../../lib/supabase';
import { getSession, createReservation } from '../../lib/supabase.ts';

/**
 * Endpoint para crear una nueva reserva
 */
export const POST = async ({ request }) => {
  try {
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Debes iniciar sesión para crear una reserva',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener datos de la reserva
    const data = await request.json();
    
    // Validar campos requeridos
    const requiredFields = ['client_id', 'queuer_id', 'service_id', 'date', 'location'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Faltan campos requeridos: ${missingFields.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar que el cliente sea el usuario autenticado o un administrador
    const { data: clientProfile, error: clientError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', data.client_id)
      .single();
    
    if (clientError || !clientProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se encontró el perfil del cliente',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (clientProfile.user_id !== session.user.id) {
      // Verificar si el usuario es admin
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', session.user.id)
        .single();
      
      if (userProfileError || !userProfile || !userProfile.is_admin) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No tienes permiso para crear esta reserva',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Validar que el representante exista
    const { data: queuerProfile, error: queuerError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.queuer_id)
      .eq('user_type', 'queuer')
      .single();
    
    if (queuerError || !queuerProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El representante seleccionado no existe',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar que el servicio exista
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('id', data.service_id)
      .single();
    
    if (serviceError || !service) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El servicio seleccionado no existe',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Crear la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert([
        {
          client_id: data.client_id,
          queuer_id: data.queuer_id,
          service_id: data.service_id,
          date: data.date,
          location: data.location,
          details: data.details || '',
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();
    
    if (reservationError) {
      console.error('Error al crear la reserva:', reservationError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al crear la reserva',
          error: reservationError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener información adicional para la notificación
    const { data: clientData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', data.client_id)
      .single();
    
    const { data: queuerData } = await supabase
      .from('profiles')
      .select('name, user_id')
      .eq('id', data.queuer_id)
      .single();
    
    // Crear notificación para el representante
    if (queuerData && queuerData.user_id) {
      await supabase.from('notifications').insert([
        {
          user_id: queuerData.user_id,
          type: 'new_reservation',
          title: 'Nueva solicitud de reserva',
          message: `${clientData?.name || 'Un cliente'} ha solicitado tus servicios para el ${new Date(data.date).toLocaleDateString()}`,
          data: { reservation_id: reservation.id },
          read: false,
          created_at: new Date().toISOString(),
        }
      ]);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reserva creada con éxito',
        data: reservation,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en el endpoint de reservas:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Endpoint para actualizar una reserva existente
 */
export const PATCH = async ({ request, params }) => {
  try {
    const reservationId = new URL(request.url).searchParams.get('id');
    
    if (!reservationId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ID de reserva no proporcionado',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Debes iniciar sesión para actualizar una reserva',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener datos de la actualización
    const data = await request.json();
    
    if (!data.status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Es necesario proporcionar el nuevo estado de la reserva',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar el estado
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        queuer_id,
        status,
        profiles!reservations_client_id_fkey(user_id),
        profiles!reservations_queuer_id_fkey(user_id)
      `)
      .eq('id', reservationId)
      .single();
    
    if (reservationError || !reservation) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Reserva no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar permisos (cliente, representante o admin)
    const clientUserId = reservation.profiles.user_id;
    const queuerUserId = reservation['profiles!reservations_queuer_id_fkey'].user_id;
    
    // Verificar si el usuario actual es el cliente, el representante o un administrador
    if (session.user.id !== clientUserId && session.user.id !== queuerUserId) {
      // Verificar si es admin
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', session.user.id)
        .single();
      
      if (userProfileError || !userProfile || !userProfile.is_admin) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No tienes permiso para actualizar esta reserva',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Verificar reglas de transición de estados
    if (!isValidStatusTransition(reservation.status, data.status, session.user.id === clientUserId)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `No es posible cambiar el estado de ${reservation.status} a ${data.status} con tu rol`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Actualizar la reserva
    const updateData = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };
    
    // Si se completa la reserva, guardar valoración y comentario
    if (data.status === 'completed' && session.user.id === clientUserId) {
      if (data.client_rating) {
        updateData.client_rating = data.client_rating;
      }
      
      if (data.client_review) {
        updateData.client_review = data.client_review;
      }
    }
    
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error al actualizar la reserva:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al actualizar la reserva',
          error: updateError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener nombres para la notificación
    const { data: clientData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', reservation.client_id)
      .single();
    
    const { data: queuerData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', reservation.queuer_id)
      .single();
    
    // Crear notificación según el cambio de estado
    let notificationData = null;
    
    if (data.status === 'confirmed') {
      // Notificar al cliente que su reserva fue confirmada
      notificationData = {
        user_id: clientUserId,
        type: 'reservation_confirmed',
        title: 'Reserva confirmada',
        message: `${queuerData?.name || 'El representante'} ha confirmado tu reserva`,
        data: { reservation_id: reservationId },
      };
    } else if (data.status === 'cancelled') {
      // Notificar según quién canceló
      const cancelledBy = session.user.id === clientUserId ? 
        clientData?.name || 'El cliente' : 
        queuerData?.name || 'El representante';
      
      const notifyUserId = session.user.id === clientUserId ? queuerUserId : clientUserId;
      
      notificationData = {
        user_id: notifyUserId,
        type: 'reservation_cancelled',
        title: 'Reserva cancelada',
        message: `${cancelledBy} ha cancelado la reserva`,
        data: { reservation_id: reservationId },
      };
    } else if (data.status === 'completed') {
      // Notificar al cliente que la reserva está completada
      notificationData = {
        user_id: clientUserId,
        type: 'reservation_completed',
        title: 'Servicio completado',
        message: `Tu servicio con ${queuerData?.name || 'el representante'} ha sido marcado como completado`,
        data: { reservation_id: reservationId },
      };
    }
    
    // Insertar notificación si corresponde
    if (notificationData) {
      await supabase.from('notifications').insert([
        {
          ...notificationData,
          read: false,
          created_at: new Date().toISOString(),
        }
      ]);
    }
    
    // Actualizar estadísticas del representante si la reserva se completó
    if (data.status === 'completed') {
      const { data: queuerStats } = await supabase
        .from('profiles')
        .select('completed_queues, rating')
        .eq('id', reservation.queuer_id)
        .single();
      
      if (queuerStats) {
        const completedQueues = (queuerStats.completed_queues || 0) + 1;
        let newRating = queuerStats.rating || 0;
        
        // Actualizar rating si se proporcionó una valoración
        if (data.client_rating) {
          // Calcular promedio ponderado
          if (queuerStats.rating && completedQueues > 1) {
            newRating = ((queuerStats.rating * (completedQueues - 1)) + data.client_rating) / completedQueues;
            // Redondear a un decimal
            newRating = Math.round(newRating * 10) / 10;
          } else {
            newRating = data.client_rating;
          }
        }
        
        await supabase
          .from('profiles')
          .update({
            completed_queues: completedQueues,
            rating: newRating,
          })
          .eq('id', reservation.queuer_id);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Estado de reserva actualizado con éxito',
        data: updatedReservation,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en el endpoint de actualización de reservas:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Función auxiliar para validar transiciones de estado
 */
function isValidStatusTransition(currentStatus, newStatus, isClient) {
  // Reglas de transición de estados
  const allowedTransitions = {
    // Tanto clientes como representantes pueden cancelar una reserva pendiente o confirmada
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'cancelled'],
    // Solo representantes pueden marcar como en progreso o completada
    in_progress: ['completed', 'cancelled'],
    // Estados finales, no se pueden cambiar
    completed: [],
    cancelled: [],
  };
  
  // Si es un cliente, tiene restricciones adicionales
  if (isClient) {
    // Los clientes no pueden marcar como en progreso o completada
    if (['in_progress', 'completed'].includes(newStatus)) {
      return false;
    }
  }
  
  // Verificar si la transición está permitida
  return allowedTransitions[currentStatus] && allowedTransitions[currentStatus].includes(newStatus);
}

/**
 * Endpoint para obtener reservas
 */
export const GET = async ({ request }) => {
  try {
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Debes iniciar sesión para ver las reservas',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // client o queuer
    const status = url.searchParams.get('status'); // pending, confirmed, etc.
    const id = url.searchParams.get('id'); // id específico de reserva
    
    // Obtener el perfil del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type, is_admin')
      .eq('user_id', session.user.id)
      .single();
    
    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se encontró el perfil del usuario',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Iniciar consulta
    let query = supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        queuer_id,
        service_id,
        date,
        location,
        details,
        status,
        client_rating,
        client_review,
        created_at,
        updated_at,
        profiles!reservations_client_id_fkey(id, name, avatar_url),
        profiles!reservations_queuer_id_fkey(id, name, avatar_url, rating),
        services(id, name, description)
      `);
    
    // Filtrar por ID específico si se proporciona
    if (id) {
      query = query.eq('id', id);
    } 
    // Si no es admin, mostrar solo las reservas del usuario
    else if (!userProfile.is_admin) {
      // Filtrar según el tipo de usuario
      if (userProfile.user_type === 'client') {
        query = query.eq('client_id', userProfile.id);
      } else if (userProfile.user_type === 'queuer') {
        query = query.eq('queuer_id', userProfile.id);
      }
    } 
    // Para admins con filtro de tipo
    else if (type) {
      if (type === 'client') {
        const clientId = url.searchParams.get('client_id');
        if (clientId) {
          query = query.eq('client_id', clientId);
        }
      } else if (type === 'queuer') {
        const queuerId = url.searchParams.get('queuer_id');
        if (queuerId) {
          query = query.eq('queuer_id', queuerId);
        }
      }
    }
    
    // Filtrar por estado si se proporciona
    if (status) {
      if (status === 'active') {
        // Reservas activas: pendientes, confirmadas o en progreso
        query = query.in('status', ['pending', 'confirmed', 'in_progress']);
      } else if (status === 'history') {
        // Historial: completadas o canceladas
        query = query.in('status', ['completed', 'cancelled']);
      } else {
        // Estado específico
        query = query.eq('status', status);
      }
    }
    
    // Ordenar por fecha
    query = query.order('date', { ascending: false });
    
    // Ejecutar consulta
    const { data: reservations, error: reservationsError } = await query;
    
    if (reservationsError) {
      console.error('Error al obtener las reservas:', reservationsError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al obtener las reservas',
          error: reservationsError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Si se solicita una reserva específica y no se encontró
    if (id && (!reservations || reservations.length === 0)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Reserva no encontrada',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: id ? reservations[0] : reservations,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en el endpoint de consulta de reservas:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 