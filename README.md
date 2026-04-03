# I.E. Jesús de Nazaret – Sistema Web Institucional

Plataforma web institucional para la **I.E. Jesús de Nazaret**, institución educativa pública de nivel secundaria ubicada en **Bellavista, Celendín, Cajamarca, Perú**.

## Datos institucionales

| Campo | Valor |
|-------|-------|
| Nombre | I.E. Jesús de Nazaret |
| Nivel | Secundaria (1.° a 5.°) |
| Gestión | Pública, gratuita |
| Modalidad | Educación Básica Regular (EBR) |
| Turno | Mañana y tarde |
| Ubicación | Bellavista, Celendín, Cajamarca |
| Código modular | 0748194 |
| Facebook | [Ver página](https://www.facebook.com/p/Institución-Educativa-Jesús-de-Nazaret-_-Bellavista-100085320282328/) |

## Stack

- **Frontend**: Astro 4 + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage)
- **IA**: Google Gemini 1.5 Flash
- **Deploy**: Vercel / Netlify

## Instalación

```bash
cd iep-jesus-nazaret
npm install
cp .env.example .env
# Configura las variables de entorno
npm run dev
```

## Variables de entorno

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
GEMINI_API_KEY=tu-gemini-api-key
PUBLIC_SITE_URL=http://localhost:4321
```

## Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar `supabase/schema.sql`
3. Ir a **Storage** y crear estos buckets públicos:
   - `logos`
   - `hero-images`
   - `blog-images`
   - `gallery-images`
   - `documents`
4. Ir a **Authentication > Users** y crear el primer usuario admin
5. El trigger automáticamente crea el perfil con rol `admin`

## Estructura del proyecto

```
src/
├── components/
│   ├── public/       # Navbar, Footer, Cards, Hero, WhatsApp
│   └── admin/        # Sidebar, Navbar, AIAssistant
├── layouts/
│   ├── BaseLayout.astro
│   ├── PublicLayout.astro
│   └── AdminLayout.astro
├── lib/
│   ├── supabase.ts   # Cliente Supabase
│   ├── gemini.ts     # Integración Gemini AI
│   └── auth.ts       # Helpers de autenticación
├── pages/
│   ├── index.astro   # Inicio
│   ├── nosotros.astro
│   ├── niveles.astro
│   ├── contacto.astro
│   ├── blog/
│   ├── noticias/
│   ├── galeria/
│   ├── eventos/
│   ├── documentos/
│   ├── api/          # contact.ts, ai.ts
│   └── admin/        # Panel administrativo
├── services/
│   ├── settings.ts   # Configuración institucional
│   └── content.ts    # CRUD de todo el contenido
├── styles/
│   └── global.css    # Estilos globales + Tailwind
└── utils/
    └── helpers.ts    # Utilidades generales
```

## Panel Administrativo

Acceder en `/admin/login`

Secciones disponibles:
- Dashboard con estadísticas
- Gestión de Blogs (con IA)
- Gestión de Noticias (con IA)
- Gestión de Galerías y Fotos
- Gestión de Eventos
- Gestión de Documentos
- Mensajes de contacto
- Configuración institucional

## Módulo de IA (Gemini)

Disponible en el panel admin al crear/editar blogs y noticias:

- **Generar borrador**: Crea contenido desde un tema
- **Mejorar texto**: Mejora la redacción existente
- **Resumir**: Genera resúmenes concisos
- **Corregir**: Ortografía y gramática
- **Sugerir títulos**: 5 opciones de títulos
- **SEO**: Meta título, descripción y resumen
- **Reescribir**: En tono formal, cercano, informativo o breve

## Deploy en Vercel

```bash
npm install @astrojs/vercel
# Cambiar en astro.config.mjs:
# import vercel from '@astrojs/vercel/serverless';
# adapter: vercel()
```

## Deploy en Netlify

```bash
npm install @astrojs/netlify
# Cambiar en astro.config.mjs:
# import netlify from '@astrojs/netlify';
# adapter: netlify()
```
