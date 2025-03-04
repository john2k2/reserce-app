# Instrucciones para aplicar la migración de la base de datos

Hemos realizado cambios importantes en la estructura de la base de datos para mejorar el manejo de servicios y reservas. Siga estos pasos para aplicar la migración correctamente:

## Pasos para aplicar la migración

1. **Conéctese a la consola SQL de Supabase**:
   - Inicie sesión en su panel de control de Supabase
   - Navegue a la sección "SQL Editor"
   - Cree un nuevo script de SQL

2. **Copie y pegue el contenido del archivo de migración**:
   - Abra el archivo `src/db/add_service_code.sql` de su proyecto
   - Copie todo su contenido
   - Péguelo en el editor SQL de Supabase

3. **Ejecute el script**:
   - Haga clic en el botón "Run" para ejecutar la migración
   - Verifique que no haya errores en la consola

## Verificación de la migración

Para confirmar que la migración se ha aplicado correctamente:

1. Navegue a la sección "Table Editor" en su panel de Supabase
2. Seleccione la tabla "services"
3. Verifique que exista una nueva columna llamada "code"
4. Confirme que los servicios tienen asignados los siguientes códigos:
   - Código "1": Trámites bancarios
   - Código "2": Eventos deportivos
   - Código "3": Conciertos
   - Código "4": Trámites gubernamentales
   - Código "5": Servicios públicos

## Reinicio de la aplicación

Después de aplicar la migración, es recomendable reiniciar la aplicación para que los cambios surtan efecto inmediatamente.

## Resolución de problemas

Si encuentra algún error durante la migración:

1. Verifique los logs de errores en la consola SQL
2. Asegúrese de que no existan servicios duplicados con el mismo código
3. Si persisten los problemas, puede contactar al equipo de desarrollo para obtener asistencia adicional

## Nota importante

Esta migración es necesaria para corregir un problema en la creación de reservas donde los IDs de servicios numéricos (1, 2, 3...) no se correspondían con los UUIDs requeridos por la base de datos.

## Explicación técnica del problema

Para que entienda mejor el problema que estamos resolviendo:

1. **Datos cruzados entre tablas**: 
   - La tabla `reservations` necesita UUIDs válidos en el campo `service_id` que referencian a `services.id`
   - Sin embargo, en la interfaz de usuario y formularios, estábamos usando IDs simples (1, 2, 3...)
   - Esta discrepancia causaba errores al crear reservas

2. **Solución implementada**:
   - Agregamos el campo `code` a la tabla `services` que contiene identificadores simples (1, 2, 3...)
   - Modificamos el API para que busque servicios tanto por UUID como por código
   - Actualizamos los formularios para usar el campo `code` en lugar del UUID `id`
   - Añadimos funciones auxiliares en la capa de acceso a datos para manejar ambos tipos de identificadores

3. **Beneficios de esta solución**:
   - Mantiene la integridad referencial de la base de datos usando UUIDs
   - Proporciona una interfaz amigable para usuarios y desarrolladores con códigos simples
   - Es compatible con el código existente y minimiza los cambios necesarios

Con esta migración, solucionamos el problema de forma elegante sin necesidad de reestructurar completamente la base de datos o la aplicación. 