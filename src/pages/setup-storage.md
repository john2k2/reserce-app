# Configuración del Almacenamiento en Supabase

Para que la funcionalidad de carga de avatares funcione correctamente, necesitas configurar el almacenamiento en Supabase.

## Opción 1: Configurar manualmente el bucket de almacenamiento

1. Inicia sesión en tu [dashboard de Supabase](https://app.supabase.io/)
2. Selecciona tu proyecto
3. Ve a la sección "Storage" en el menú lateral
4. Haz clic en "New Bucket"
5. Nombra el bucket como "avatars"
6. Marca la opción "Public bucket" para que las imágenes sean accesibles públicamente
7. Haz clic en "Create bucket"

## Opción 2: Configurar la clave de servicio para creación automática

Si prefieres que el bucket se cree automáticamente, necesitas configurar la clave de servicio de Supabase:

1. Inicia sesión en tu [dashboard de Supabase](https://app.supabase.io/)
2. Selecciona tu proyecto
3. Ve a "Project Settings" (Configuración del proyecto)
4. Ve a la pestaña "API"
5. Busca la sección "Project API keys" (Claves API del proyecto)
6. Copia la clave "service_role key" (clave de rol de servicio)
7. Crea o edita el archivo `.env.local` en la raíz de tu proyecto
8. Añade la siguiente línea:
   ```
   SUPABASE_SERVICE_KEY=tu_clave_de_servicio_aquí
   ```
9. Reinicia el servidor de desarrollo

## Configuración de políticas de seguridad

Para permitir que los usuarios suban y accedan a sus avatares, necesitas configurar las políticas de seguridad adecuadas:

1. En el dashboard de Supabase, ve a la sección "Storage"
2. Selecciona el bucket "avatars"
3. Ve a la pestaña "Policies" (Políticas)
4. Configura las siguientes políticas:

### Política para SELECT (leer archivos)
- Nombre: "Permitir acceso público a los avatares"
- Permitido para: `true` (todos pueden ver los avatares)

### Política para INSERT (subir archivos)
- Nombre: "Permitir a usuarios autenticados subir avatares"
- Permitido para: `auth.role() = 'authenticated'` (solo usuarios autenticados pueden subir)

### Política para UPDATE (actualizar archivos)
- Nombre: "Permitir a usuarios actualizar sus propios avatares"
- Permitido para: `auth.uid() = (storage.foldername)[1]::uuid` (asumiendo que usas el ID del usuario en la ruta)

### Política para DELETE (eliminar archivos)
- Nombre: "Permitir a usuarios eliminar sus propios avatares"
- Permitido para: `auth.uid() = (storage.foldername)[1]::uuid` (asumiendo que usas el ID del usuario en la ruta)

## Solución de problemas

Si encuentras errores relacionados con "Bucket not found" o "violates row-level security policy", asegúrate de:

1. Que el bucket "avatars" existe en tu proyecto de Supabase
2. Que has configurado correctamente las políticas de seguridad
3. Que estás usando la clave de servicio si intentas crear el bucket automáticamente

Para más información, consulta la [documentación oficial de Supabase Storage](https://supabase.com/docs/guides/storage). 