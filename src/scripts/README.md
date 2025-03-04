# Scripts de Prueba para Funcionalidades del Cliente

Este directorio contiene scripts para probar las funcionalidades implementadas para el rol de cliente en la aplicación.

## Requisitos Previos

Para ejecutar estos scripts, necesitarás:

1. Node.js v14 o superior
2. npm o yarn instalado
3. Las dependencias instaladas: `npm install` o `yarn install`
4. Un archivo `.env` configurado con las siguientes variables:

```
# Configuración para test-client-features.js
PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_KEY=tu_clave_de_servicio_de_supabase

# Credenciales de usuario de prueba (debe existir en Supabase)
TEST_CLIENT_EMAIL=cliente@ejemplo.com
TEST_CLIENT_PASSWORD=Contraseña123!

# Configuración para test-api.js
API_BASE_URL=http://localhost:3000
TEST_AUTH_TOKEN=un_token_de_autenticacion_valido
TEST_PROFILE_ID=id_del_perfil_a_actualizar
TEST_RESERVATION_ID=id_de_reserva_para_valorar
TEST_ACTIVE_RESERVATION_ID=id_de_reserva_para_cancelar
```

## Descripción de los Scripts

### 0. test-basic.js (NUEVO - EJECUTAR PRIMERO)

Este script básico verifica la conexión a Supabase y muestra información sobre los perfiles y servicios existentes en la base de datos. **Úsalo primero para verificar que tus credenciales de Supabase son correctas y para identificar los usuarios existentes.**

**Cómo ejecutar:**
```bash
node src/scripts/test-basic.js
```

### 1. test-client-features.js

Este script realiza una prueba completa de todas las funcionalidades del cliente interactuando directamente con la base de datos Supabase. Es útil para verificar la lógica de negocio y el acceso a datos.

> **IMPORTANTE**: El script ahora incluye la capacidad de crear automáticamente un usuario de prueba si no existe.

**Funcionalidades que prueba:**
- Autenticación y obtención del perfil
- Actualización del perfil
- Búsqueda de representantes
- Creación de reservas
- Consulta de reservas activas
- Cancelación de reservas
- Valoración de reservas completadas
- Actualización de la puntuación del representante

**Cómo ejecutar:**
```bash
node src/scripts/test-client-features.js
```

### 2. test-api.js

Este script prueba los endpoints de API específicos implementados para el rol de cliente. Es útil para verificar que los endpoints funcionan correctamente.

**Endpoints que prueba:**
- `/api/update-profile` - Actualización del perfil
- `/api/rate-reservation` - Valoración de una reserva
- `/api/update-reservation-status` - Actualización del estado de una reserva (cancelación)

**Cómo ejecutar:**
```bash
node src/scripts/test-api.js
```

## Resolución de Problemas Comunes

### Error: "Invalid login credentials"

Este error puede ocurrir en los siguientes casos:

1. **El usuario no existe en Supabase**:
   - Ejecuta primero `test-basic.js` para ver los usuarios existentes
   - El script `test-client-features.js` ahora intentará crear automáticamente un usuario si no existe

2. **Credenciales incorrectas en el archivo .env**:
   - Verifica que `TEST_CLIENT_EMAIL` y `TEST_CLIENT_PASSWORD` coincidan con un usuario existente
   - Si estás usando credenciales nuevas, asegúrate de que cumplan con los requisitos de seguridad (ej. contraseñas con al menos 8 caracteres)

3. **URL o clave de Supabase incorrectas**:
   - Verifica que `PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_KEY` sean correctas
   - La clave de servicio debe tener permisos suficientes para acceder a la base de datos

### Error: "Cannot access profiles"

Este error puede ocurrir por:

1. **Permisos insuficientes**: La clave de servicio no tiene permisos para acceder a la tabla `profiles`
2. **Tabla inexistente**: La tabla `profiles` no existe en tu base de datos
3. **Estructura incorrecta**: La tabla `profiles` no tiene la estructura esperada

Ejecuta primero `test-basic.js` para diagnosticar estos problemas.

### Error en consultas de servicios o representantes

Si aparecen errores relacionados con la falta de representantes o servicios:

1. Asegúrate de tener al menos un usuario de tipo "queuer" en la tabla `profiles`
2. Verifica que existan servicios en la tabla `services`
3. Comprueba la relación entre queuers y servicios en la tabla `queuer_services`

## Personalización

Puedes modificar los scripts para probar casos específicos o extenderlos para cubrir más funcionalidades según sea necesario.

## Orden Recomendado de Ejecución

Para mejores resultados, ejecuta los scripts en este orden:

1. Primero `test-basic.js` para verificar la conexión y ver los usuarios existentes
2. Luego `test-client-features.js` para pruebas de acceso directo a la base de datos
3. Finalmente `test-api.js` para probar los endpoints de la API 