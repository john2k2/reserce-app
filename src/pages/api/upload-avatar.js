import { supabase, supabaseAdmin } from '../../lib/supabase';
import { getSession } from '../../lib/supabase.ts';

// Endpoint para subir imágenes de avatar
export const POST = async ({ request }) => {
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
    const filePath = fileName;
    
    // Convertir el Blob a un ArrayBuffer para subirlo a Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    
    // Verificar si el bucket existe y crearlo si no existe
    const bucketName = 'avatars';
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error al listar buckets:', bucketsError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al verificar el almacenamiento. Por favor, inténtalo de nuevo.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Verificar si el bucket 'avatars' existe
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    // Si el bucket no existe, intentar crearlo
    if (!bucketExists) {
      console.log('El bucket "avatars" no existe. Intentando crearlo...');
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true // Hacer el bucket público para que las imágenes sean accesibles
      });
      
      if (createBucketError) {
        console.error('Error al crear el bucket:', createBucketError);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Error al crear el almacenamiento para avatares. Por favor, contacta al administrador.',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
      console.log('Bucket "avatars" creado exitosamente');
    }
    
    // Subir el archivo a Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });
    
    if (error) {
      console.error('Error al subir el avatar:', error);
      
      // Mensaje específico si el bucket no existe
      if (error.message === 'Bucket not found' || error.error === 'Bucket not found') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'El almacenamiento para avatares no está configurado. Por favor, contacta al administrador para crear el bucket "avatars" en Supabase.',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
      
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
    const { data: urlData } = supabaseAdmin.storage
      .from(bucketName)
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