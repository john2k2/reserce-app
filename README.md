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

---

Hecho con ❤️ por el equipo de QueueMaster
