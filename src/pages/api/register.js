import { supabase, signUp, createProfile } from '../../lib/supabase';

// Endpoint para manejar el registro de usuarios
export async function post({ request }) {
  try {
    const body = await request.json();

    // Validar los datos requeridos
    if (!body.email || !body.password || !body.name || !body.user_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Faltan campos requeridos: email, password, name y user_type son obligatorios.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Comprobar que el tipo de usuario es válido
    if (!['client', 'queuer'].includes(body.user_type)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'El tipo de usuario debe ser "client" o "queuer".',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Extraer campos de autenticación
    const { email, password } = body;
    
    // Extraer y preparar los campos para el perfil
    const userData = { 
      name: body.name,
      email: body.email,
      user_type: body.user_type,
      city: body.city || null,
      phone: body.phone || null,
    };
    
    // Añadir campos específicos para representantes si es necesario
    if (body.user_type === 'queuer') {
      userData.speciality = body.speciality || null;
      userData.rate_per_hour = body.rate_per_hour ? parseFloat(body.rate_per_hour) : null;
      userData.description = body.description || null;
      userData.completed_queues = 0;
      userData.rating = null;
      userData.is_verified = false;
    }
    
    // Registro con Supabase Auth
    const { data: authData, error: authError } = await signUp(email, password, userData);
    
    if (authError) {
      console.error('Error de autenticación:', authError);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: authError.message || 'Error durante el registro. Por favor, inténtalo de nuevo.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Crear perfil en la tabla profiles usando la función helpers
    const { data: profileData, error: profileError } = await createProfile({
      user_id: authData.user.id,
      ...userData
    });
    
    if (profileError) {
      console.error('Error al crear perfil:', profileError);
      
      // En caso de error al crear el perfil, podríamos considerar eliminar el usuario de auth
      // pero Supabase debería manejar esto con un trigger o una función
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al crear el perfil de usuario. Por favor, inténtalo de nuevo.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Registro exitoso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario registrado correctamente',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          user_type: userData.user_type,
        },
      }),
      {
        status: 201, // Created
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('Error en el endpoint de registro:', error);
    
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