import { supabase, supabaseAdmin } from '../../lib/supabase';

// Endpoint para manejar el registro de usuarios
export const POST = async ({ request }) => {
  try {
    console.log('Procesando solicitud de registro...');
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    
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
    
    console.log('Usuario creado en Auth:', authData.user.id);
    
    // Asegurarse de que tenemos un ID de usuario válido
    if (!authData?.user?.id) {
      console.error('Error: No se pudo obtener el ID de usuario después del registro');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al crear el usuario. No se pudo obtener el ID.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // Crear perfil en la tabla profiles directamente
    const profileData = {
      id: authData.user.id, // Usar el mismo ID que el usuario de Auth
      user_id: authData.user.id,
      name: userData.name,
      email: userData.email,
      user_type: userData.user_type,
      city: userData.city,
      phone: userData.phone,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    
    // Añadir campos específicos para representantes
    if (userData.user_type === 'queuer') {
      profileData.speciality = userData.speciality;
      profileData.rate_per_hour = userData.rate_per_hour;
      profileData.description = userData.description;
      profileData.completed_queues = 0;
      profileData.rating = null;
      profileData.is_verified = false;
    }
    
    console.log('Datos del perfil a crear:', profileData);
    
    // Intentar crear el perfil directamente con Supabase Admin (rol de servicio)
    try {
      // Primero, verificar si ya existe un perfil con este ID
      const { data: existingProfile, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', profileData.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 es "no se encontró ningún registro"
        console.error('Error al verificar perfil existente:', checkError);
      }
      
      if (existingProfile) {
        console.log('El perfil ya existe, no es necesario crearlo');
        
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
      }
      
      // Si no existe, intentar crearlo con el cliente de administrador
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert([profileData]);
        
      if (insertError) {
        console.error('Error detallado al crear perfil:', JSON.stringify(insertError, null, 2));
        
        // Intentar sin el campo ID
        const profileWithoutId = { ...profileData };
        delete profileWithoutId.id;
        
        const { data: insertData2, error: insertError2 } = await supabaseAdmin
          .from('profiles')
          .insert([profileWithoutId]);
          
        if (insertError2) {
          console.error('Error al crear perfil sin ID:', insertError2);
          
          return new Response(
            JSON.stringify({
              success: false,
              message: `Error al crear el perfil de usuario: ${insertError.message || 'Error desconocido'}`,
              details: { firstError: insertError, secondError: insertError2 },
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        }
        
        console.log('Perfil creado sin ID específico');
      } else {
        console.log('Perfil creado exitosamente');
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
      console.error('Excepción al crear perfil:', error);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Error al crear el perfil de usuario. Excepción inesperada.',
          details: error.message || 'Error desconocido',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
  } catch (error) {
    console.error('Error en el endpoint de registro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
        details: error.message || 'Error desconocido',
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