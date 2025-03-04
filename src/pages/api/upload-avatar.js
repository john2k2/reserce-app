import { supabase, getSession } from '../../lib/supabase';

// Endpoint para subir imágenes de avatar
export async function post({ request }) {
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
    
    // El ID de usuario será usado para crear un nombre único para el archivo
    const userId = sessionData.session.user.id;
    
    // Verificar que la solicitud es multipart
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Se espera un formulario multipart.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Procesar la solicitud multipart
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No se proporcionó ningún archivo válido.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Verificar el tipo de archivo
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El tipo de archivo no es válido. Se aceptan: JPG, PNG, GIF, WEBP.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Verificar el tamaño del archivo (2MB máximo)
    const maxSize = 2 * 1024 * 1024; // 2MB en bytes
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El archivo es demasiado grande. El tamaño máximo es 2MB.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Crear un nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Convertir el Blob a un ArrayBuffer para subirlo a Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    
    // Subir el archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });
    
    if (error) {
      console.error('Error al subir el avatar:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: error.message || 'Error al subir la imagen. Por favor, inténtalo de nuevo.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    // Subida exitosa
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Avatar subido correctamente',
        url: urlData.publicUrl,
        path: filePath,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error en el endpoint de subida de avatar:', error);
    
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