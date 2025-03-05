import { supabase, supabaseAdmin } from '../../../lib/supabase';
import type { APIContext } from 'astro';

export const POST = async ({ request }: APIContext) => {
  try {
    // Verificar autenticación
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Debes iniciar sesión para actualizar tu perfil',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obtener datos del perfil a actualizar
    const profileData = await request.json();
    console.log('Datos recibidos para actualización de perfil:', profileData);
    
    // Obtener el perfil actual del usuario
    const userId = session.user.id;
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Error al obtener perfil del usuario:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo encontrar tu perfil',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Procesar imagen base64 si existe
    let filteredData: Record<string, any> = {};
    
    if (profileData.avatar_base64 && profileData.avatar_base64.startsWith('data:image')) {
      try {
        // Extraer datos de la imagen base64
        const base64Data = profileData.avatar_base64.split(',')[1];
        const mimeType = profileData.avatar_base64.split(';')[0].split(':')[1];
        const fileExt = mimeType.split('/')[1];
        const fileName = `avatar-${userProfile.id}-${Date.now()}.${fileExt}`;
        
        // Convertir base64 a buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Subir imagen a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('avatars')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
          });
        
        if (uploadError) {
          console.error('Error al subir imagen:', uploadError);
        } else if (uploadData) {
          // Obtener URL pública de la imagen
          const { data: urlData } = await supabaseAdmin
            .storage
            .from('avatars')
            .getPublicUrl(fileName);
          
          if (urlData) {
            // Añadir URL de la imagen a los datos a actualizar
            filteredData.avatar_url = urlData.publicUrl;
          }
        }
      } catch (imageError) {
        console.error('Error al procesar imagen:', imageError);
      }
    }
    
    // Campos permitidos para actualizar
    const allowedFields = ['name', 'phone', 'city', 'description'];
    
    // Filtrar solo los campos permitidos
    allowedFields.forEach(key => {
      if (profileData[key] !== undefined) {
        filteredData[key] = profileData[key];
      }
    });
    
    // Si se proporcionó avatar_url directamente (no como base64)
    if (profileData.avatar_url && !profileData.avatar_base64) {
      filteredData.avatar_url = profileData.avatar_url;
    }
    
    // Añadir timestamp de actualización
    filteredData.updated_at = new Date().toISOString();
    
    console.log('Datos filtrados para actualización:', filteredData);
    
    // Actualizar el perfil
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(filteredData)
      .eq('id', userProfile.id)
      .select();
    
    if (updateError) {
      console.error('Error al actualizar perfil:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error al actualizar perfil: ${updateError.message}`,
          error: updateError
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!updateResult || updateResult.length === 0) {
      console.error('No se pudo actualizar el perfil. Resultado vacío.');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se pudo actualizar el perfil',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Perfil actualizado con éxito:', updateResult);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Perfil actualizado con éxito',
        data: updateResult[0]
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error en el endpoint de actualización de perfil:', error);
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