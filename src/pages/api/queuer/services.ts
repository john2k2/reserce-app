import type { APIRoute } from 'astro';
import { supabase, getSession } from '../../../lib/supabase.ts';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verificar autenticación
    const { data: sessionData, error: sessionError } = await getSession();
    
    if (sessionError || !sessionData?.session) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No autorizado. Debes iniciar sesión.' 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener el perfil del usuario
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('user_id', sessionData.session.user.id)
      .single();
    
    if (profileError || !profileData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No se pudo obtener el perfil del usuario.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar que el usuario es un representante
    if (profileData.user_type !== 'queuer') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Solo los representantes pueden actualizar servicios.' 
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener datos del cuerpo de la solicitud
    const body = await request.json();
    const { services } = body;
    
    if (!services || !Array.isArray(services)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Datos de servicios inválidos.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Eliminar servicios existentes del representante
    const { error: deleteError } = await supabase
      .from('queuer_services')
      .delete()
      .eq('queuer_id', profileData.id);
    
    if (deleteError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error al eliminar servicios existentes.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Si no hay servicios para agregar, terminar aquí
    if (services.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Servicios actualizados correctamente.' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Preparar datos para inserción
    const servicesToInsert = services.map(service => ({
      queuer_id: profileData.id,
      service_id: service.service_id,
      rate_per_hour: service.rate_per_hour || 0
    }));
    
    // Insertar nuevos servicios
    const { data: insertData, error: insertError } = await supabase
      .from('queuer_services')
      .insert(servicesToInsert)
      .select();
    
    if (insertError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error al agregar servicios.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Servicios actualizados correctamente.',
        data: insertData
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en API de servicios:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor.' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 