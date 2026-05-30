# 🚀 Guía de Despliegue - Zen Garden

## Paso 1: Inicializar Git y GitHub

```bash
# Inicializar repositorio Git
git init

# Configurar usuario
git config user.name "Tu Nombre"
git config user.email "tu@email.com"

# Crear primer commit
git add .
git commit -m "Initial commit: Zen Garden app with Three.js"
```

## Paso 2: Crear Repositorio en GitHub

1. Ir a [github.com](https://github.com) y crear nuevo repositorio
2. Nombre: `zen-garden`
3. Descripción: "Un jardín zen interactivo y meditativo"
4. Público (para que sea visible y gratis)

```bash
# Agregar remote al repositorio local
git remote add origin https://github.com/tu-usuario/zen-garden.git

# Renombrar rama a 'main' si es necesario
git branch -M main

# Subir cambios
git push -u origin main
```

## Paso 3: Desplegar en Netlify

### Opción A: Automático desde GitHub (Recomendado)

1. Ir a [netlify.com](https://netlify.com) y loguear con GitHub
2. Click en "New site from Git"
3. Seleccionar GitHub y el repositorio `zen-garden`
4. Configuración:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click en "Deploy site"

Netlify desplegará automáticamente cada vez que hagas push a main.

### Opción B: Despliegue manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Loguear
netlify login

# Desplegar
netlify deploy --prod
```

## Paso 4: Configurar Dominio Personalizado (Opcional)

En Netlify dashboard:
1. Ir a Site Settings > Domain Management
2. Agregar dominio personalizado
3. Configurar DNS según las instrucciones

## Paso 5: Neon Database (Futuro)

Cuando necesites persistencia:

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear nuevo proyecto PostgreSQL
3. Copiar connection string a `.env`
4. Crear backend API (Node.js/Express)
5. Desplegar API en Netlify Functions o Vercel

Ejemplo `.env`:
```
VITE_DATABASE_URL=postgresql://user:password@db.neon.tech/zen_garden
```

## Scripts Útiles

```bash
# Desarrollo local
npm run dev          # Inicia servidor en http://localhost:3000

# Testing
npm run lint         # Verifica código

# Build
npm run build        # Compila para producción
npm run preview      # Previsualiza build local
```

## Troubleshooting

### El sitio en Netlify dice "Page Not Found"
- Verifica que `netlify.toml` esté correctamente configurado
- El build command debe ser: `npm run build`
- Publish directory debe ser: `dist`

### Build falla en Netlify
- Comprueba que funciona localmente: `npm run build`
- Verifica que `package.json` está en la raíz
- Asegúrate que no hay archivos .env sin commitear

### Audio no funciona en producción
- Verificar que el navegador permite audio
- Algunos navegadores requieren interacción del usuario primero
- Revisar console del navegador para errores de CORS

## Monitoreo

Netlify proporciona:
- Deploy logs en dashboard
- Analytics de tráfico
- Notificaciones de errores
- SSL automático (HTTPS)

---

¡Tu jardín zen está en el internet! 🌿
