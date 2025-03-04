# Instrucciones para configurar la base de datos

## Problemas detectados

1. **Problema inicial**: La tabla `profiles` no existe en tu base de datos de Supabase.
2. **Segundo problema**: Políticas de seguridad (RLS) que impiden la inserción de perfiles.
3. **Tercer problema**: Error en el dashboard después del registro exitoso.

## Solución completa (tres pasos)

### Paso 1: Crear la tabla `profiles`

1. Inicia sesión en tu panel de control de Supabase: [https://app.supabase.io](https://app.supabase.io)
2. Selecciona tu proyecto (`tssuxuzfdvmqhiwcnfqt`)
3. Ve a la sección "SQL Editor" en el menú lateral
4. Crea un nuevo script SQL
5. Copia y pega el código SQL del archivo `src/db/create_profiles_table.sql`
6. Ejecuta el script haciendo clic en el botón "Run" o "Ejecutar"

### Paso 2: Configurar la clave de servicio (Service Key)

Para implementar la solución más segura:

1. Ve a la sección "Project Settings" > "API" en el panel de control de Supabase
2. Copia la "service_role key" (¡mantén esta clave segura!)
3. Agrega esta clave a tu archivo `.env` como `SUPABASE_SERVICE_KEY`

```
SUPABASE_SERVICE_KEY=tu_clave_de_servicio_aquí
```

### Paso 3: Crear la tabla de reservaciones

Para que el dashboard funcione correctamente después del registro:

1. Crea un nuevo script SQL en el SQL Editor de Supabase
2. Copia y pega el código SQL del archivo `src/db/create_reservations_table.sql`
3. Ejecuta el script haciendo clic en el botón "Run" o "Ejecutar"

## Explicación

### Sobre la tabla `profiles`

La tabla `profiles` almacena la información de los usuarios registrados, como nombre, tipo de usuario, etc. Esta tabla es esencial para el funcionamiento de la aplicación.

### Sobre la clave de servicio

La clave de servicio (Service Key) permite a tu API realizar operaciones con privilegios elevados, como crear perfiles de usuario, sin tener que modificar las políticas de seguridad. Esta es la solución más segura.

### Sobre la tabla de reservaciones

La tabla `reservations` almacena las reservas realizadas por los clientes con los representantes. Esta tabla es necesaria para que el dashboard funcione correctamente después del registro.

## Después de aplicar todos los pasos

Una vez que hayas completado todos los pasos:

1. Reinicia tu servidor de desarrollo
2. Intenta registrar un usuario nuevamente
3. Deberías ser redirigido al dashboard correctamente después del registro

Si sigues teniendo problemas, verifica los logs del servidor para obtener más información sobre el error. 