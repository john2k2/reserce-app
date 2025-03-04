# Scripts de Prueba para "Mis Reservas"

Esta carpeta contiene scripts para probar la funcionalidad de "Mis Reservas" en la aplicación, específicamente para el usuario con email `johmarket36@gmail.com`.

## Requisitos previos

Para ejecutar estos scripts, necesitas tener instalado:

1. Node.js (v14 o superior)
2. npm (incluido con Node.js)

## Configuración rápida

Ejecuta el asistente de configuración para crear el archivo `.env` necesario:

```bash
node scripts/setup-env.js
```

Este script interactivo te guiará en la creación del archivo `.env` con las credenciales de Supabase necesarias.

## Configuración manual

Si prefieres configurar manualmente:

1. Instala las dependencias necesarias:

```bash
npm install playwright node-fetch @supabase/supabase-js dotenv
```

2. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-service-role
```

> **IMPORTANTE**: Necesitas usar la clave **service_role**, no la clave anon pública, ya que los scripts necesitan permisos de administrador para crear registros.

## Solución de problemas con .env

Si estás teniendo problemas con el archivo `.env`:

1. Asegúrate de que el archivo esté en la raíz del proyecto (no en la carpeta `scripts/`)
2. Verifica que no haya espacios antes o después de los signos igual: `CLAVE=valor` (correcto) vs `CLAVE = valor` (incorrecto)
3. Comprueba que estás usando la clave **service_role** de Supabase, no la clave anon
4. Para obtener más diagnóstico, ejecuta `scripts/create-test-reservation.js` que ahora incluye información detallada de errores

## Scripts disponibles

### 1. Crear una reserva de prueba

Este script crea una reserva de prueba en estado "pendiente" para el usuario.

```bash
node scripts/create-test-reservation.js
```

### 2. Probar la API de reservas

Este script prueba la API de cancelación de reservas directamente, sin usar un navegador.

```bash
node scripts/test-reservation-api.js
```

> **Nota**: Por defecto, este script no cancela ninguna reserva realmente. Para activar la cancelación, descomenta las líneas indicadas en el código.

### 3. Probar la interfaz de "Mis Reservas"

Este script abre un navegador y prueba la interfaz de usuario de "Mis Reservas".

```bash
node scripts/test-reservations.js
```

> **Nota**: Este script abre un navegador Chrome para que puedas ver la prueba en acción. También por defecto no cancela ninguna reserva.

## Personalización

En todos los scripts, puedes modificar la contraseña en la configuración para que coincida con la contraseña real del usuario `johmarket36@gmail.com`:

```javascript
const config = {
  credentials: {
    email: 'johmarket36@gmail.com',
    password: '123123123' // Ya actualizada con la contraseña correcta
  }
};
```

## Flujo de prueba recomendado

1. Ejecuta `create-test-reservation.js` para crear una reserva de prueba.
2. Ejecuta `test-reservations.js` para verificar que la reserva aparece en la interfaz.
3. Opcionalmente, prueba la cancelación descomentando las líneas indicadas en `test-reservation-api.js`.

## Solución de problemas

- Si recibes errores de autenticación, verifica que la contraseña sea correcta.
- Si los scripts de Playwright fallan, asegúrate de tener instalada la última versión de los navegadores: `npx playwright install`
- Para ver registros detallados, puedes añadir `DEBUG=pw:api` antes del comando, por ejemplo: `DEBUG=pw:api node scripts/test-reservations.js` 