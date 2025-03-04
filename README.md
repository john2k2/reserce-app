# QueueMaster - Aplicación de Gestión de Filas y Representantes

QueueMaster es una aplicación web moderna que permite a los usuarios contratar a representantes (queuers) para hacer fila en su lugar, ahorrando tiempo en trámites, eventos, conciertos y más.

![QueueMaster](https://via.placeholder.com/1200x630/4F46E5/FFFFFF?text=QueueMaster)

## 📋 Características

- **Diseño Responsive**: Interfaz adaptable a dispositivos móviles, tablets y escritorio.
- **Tema Claro/Oscuro**: Soporte completo para modo oscuro con cambio automático según preferencias del sistema.
- **Gestión de Representantes**: Visualización de perfiles de representantes con sus valoraciones, experiencia y servicios.
- **Seguimiento de Filas**: Monitoreo en tiempo real de la posición en fila y tiempo estimado de espera.
- **Historial de Reservas**: Registro completo de reservas pasadas con valoraciones y comentarios.
- **Múltiples Servicios**: Soporte para diferentes tipos de servicios (conciertos, trámites, eventos deportivos, etc.).

## 🚀 Tecnologías Utilizadas

- **[Astro](https://astro.build/)**: Framework web moderno con renderizado en servidor.
- **[Tailwind CSS](https://tailwindcss.com/)**: Utilidad de CSS para desarrollo rápido e interfaces personalizadas.
- **JavaScript**: Para interacciones del cliente y funcionalidades dinámicas.

## 🛠️ Instalación

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [npm](https://www.npmjs.com/) (v7 o superior)

### Pasos de instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/reserce-app.git
cd reserce-app
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Ejecutar en modo desarrollo**

```bash
npm run dev
```

4. **Compilar para producción**

```bash
npm run build
```

5. **Previsualizar la versión de producción**

```bash
npm run preview
```

## 🏗️ Estructura del Proyecto

```
reserce-app/
├── public/          # Archivos estáticos (imágenes, fuentes, etc.)
├── src/
│   ├── assets/      # Recursos utilizados por la aplicación
│   ├── components/  # Componentes de UI reutilizables
│   ├── layouts/     # Plantillas de layout para las páginas
│   └── pages/       # Páginas de la aplicación (rutas)
├── .gitignore       # Archivos y carpetas ignorados por git
├── astro.config.mjs # Configuración de Astro
├── package.json     # Dependencias y scripts
└── README.md        # Este archivo
```

## 📱 Responsive Design

La aplicación está optimizada para diferentes tamaños de pantalla:

- **Móvil**: Interfaces simplificadas con navegación adaptada y vistas optimizadas para pantallas pequeñas.
- **Tablet**: Aprovechamiento del espacio disponible con navegación mejorada.
- **Escritorio**: Experiencia completa con todas las funcionalidades visibles.

Implementamos:
- Menús laterales responsivos que se convierten en modales en dispositivos móviles
- Tablas que se transforman en tarjetas en pantallas pequeñas
- Tamaños de texto y espaciado adaptables

## 🌓 Modo Oscuro

QueueMaster ofrece soporte completo para modo oscuro:

- **Automático**: Detecta las preferencias del sistema
- **Manual**: Toggle para cambiar entre temas claro y oscuro
- **Persistente**: Guarda la preferencia en localStorage

Hemos optimizado cuidadosamente los contrastes y colores para garantizar la legibilidad y accesibilidad en ambos modos.

## 📋 Funcionalidades Principales

### 1. Buscar Representantes

Encuentra representantes disponibles según:
- Tipo de servicio
- Ubicación
- Valoraciones
- Disponibilidad

### 2. Reservar un Representante

Proceso sencillo para contratar a un representante para tus trámites o eventos:
- Selección de fecha y hora
- Especificación de detalles del servicio
- Métodos de pago seguros

### 3. Seguimiento en Tiempo Real

Monitorea el estado de tu fila:
- Posición actual
- Tiempo estimado de espera
- Ubicación del representante
- Comunicación directa con el queuer

### 4. Historial y Valoraciones

Mantén un registro de tus servicios pasados:
- Califica a tus representantes
- Deja comentarios sobre tu experiencia
- Consulta tu historial completo

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si quieres contribuir:

1. Haz un fork del repositorio
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Sube tu rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

Si tienes preguntas o sugerencias, no dudes en contactarnos en [contacto@queuemaster.com](mailto:contacto@queuemaster.com)

## Optimizaciones de Rendimiento

La aplicación ha sido optimizada para ofrecer el mejor rendimiento y experiencia de usuario:

### Optimización de Imágenes

- **Lazy Loading**: Las imágenes se cargan utilizando el atributo `loading="lazy"` para mejorar los tiempos de carga iniciales y reducir el consumo de datos.
- **Dimensiones Explícitas**: Todas las imágenes incluyen atributos `width` y `height` para evitar Cumulative Layout Shift (CLS).
- **Imagen de Fallback**: Se proporciona una imagen de respaldo para situaciones en las que las imágenes no pueden cargarse.

### Carga Diferida de Componentes

- **Componentes Críticos vs No Críticos**: Los componentes críticos para la primera vista se cargan inmediatamente, mientras que los componentes secundarios utilizan carga diferida para optimizar el tiempo de carga.
- **Dynamic Imports**: Utilizamos importaciones dinámicas para componentes pesados que no son necesarios para la renderización inicial.

### Progressive Web App (PWA)

- **Service Worker**: La aplicación utiliza un Service Worker para mejorar la experiencia offline y la velocidad de carga.
- **Estrategias de Caché**:
  - Cache-first para recursos estáticos
  - Network-first con tiempo límite para datos dinámicos
- **Capacidades Offline**: Los usuarios pueden navegar por partes de la aplicación incluso sin conexión a internet.
- **Background Sync**: Las operaciones fallidas se sincronizan automáticamente cuando se restablece la conexión.

### Optimización de Recursos

- **Precargar Recursos Críticos**: Los recursos esenciales se precargan para una experiencia más fluida.
- **Prefetch de DNS**: Optimización de la carga de recursos de terceros mediante prefetch de DNS.
- **Compresión Brotli**: Archivos estáticos comprimidos para reducir el tamaño de transferencia.
- **Minificación**: HTML, CSS y JavaScript minificados para producción.

### Rendimiento de Tiempo de Ejecución

- **Evita CLS**: Implementación de técnicas que evitan el Cumulative Layout Shift, como la detección y aplicación del modo oscuro antes de la renderización.
- **Chunk Splitting**: División de código por rutas y componentes para optimizar la carga bajo demanda.

## Capacidades Offline y Sincronización

QueueMaster ha sido diseñado con una arquitectura offline-first:

- **Acceso Sin Conexión**: Los usuarios pueden acceder a la aplicación y ver datos previamente cargados sin conexión a internet.
- **Mensaje de Estado**: Se muestra claramente cuando la aplicación está funcionando en modo offline.
- **Cola de Operaciones**: Las reservaciones y otras operaciones realizadas sin conexión se almacenan localmente.
- **Sincronización Automática**: Las operaciones pendientes se sincronizan automáticamente cuando se restablece la conexión.
- **IndexedDB**: Utilizamos IndexedDB para almacenamiento local eficiente y persistente.

---

Hecho con ❤️ por el equipo de QueueMaster
