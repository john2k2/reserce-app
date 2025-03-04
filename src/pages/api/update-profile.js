import { getSession, supabase } from '../../lib/supabase.ts';

// Endpoint para actualizar el perfil del usuario
export async function post({ request }) {
  // Verificar autenticación
  const { data: sessionData, error: sessionError } = await getSession();
  
  if (sessionError || !sessionData?.session) {
    return new Response(
      JSON.stringify({
        error: 'No autorizado. Debes iniciar sesión para actualizar tu perfil.'
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
    // Si hay un archivo de avatar, procesarlo primero
    const formData = await request.formData();
    const avatar = formData.get('avatar');
    const profileId = formData.get('id');
    
    // Verificar que el usuario está actualizando su propio perfil
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();
    
    if (profileData?.user_id !== userId) {
      return new Response(
        JSON.stringify({
          error: 'No tienes permiso para actualizar este perfil'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Preparar datos para actualizar
    const updateData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || null,
      city: formData.get('city') || null,
      description: formData.get('description') || null,
      updated_at: new Date().toISOString()
    };
    
    // Si se proporciona un nuevo avatar, subirlo al almacenamiento
    let avatarUrl = null;
    if (avatar && avatar.size > 0) {
      const fileExt = avatar.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Error al subir avatar: ${uploadError.message}`);
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      avatarUrl = urlData?.publicUrl;
      
      // Agregar URL del avatar a los datos a actualizar
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
    }
    
    // Actualizar perfil en la base de datos
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileId);
    
    if (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: {
          ...updateData,
          id: profileId
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error en update-profile:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Error al actualizar el perfil'
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