# 💻 Guía de Desarrollo Local

## Requisitos

- Node.js 18+ (descarga desde [nodejs.org](https://nodejs.org))
- npm (viene con Node.js)
- Git (para control de versiones)
- Un editor de código (VS Code recomendado)

## Instalación Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/zen-garden.git
cd zen-garden

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

El servidor abrirá automáticamente en `http://localhost:3000`

## Estructura del Proyecto

```
zen-garden/
├── src/
│   ├── components/
│   │   ├── ZenGardenCanvas.jsx    # Renderizado 3D principal
│   │   ├── ZenGardenCanvas.css
│   │   ├── SoundControl.jsx       # Control de audio
│   │   └── SoundControl.css
│   ├── App.jsx                    # Componente principal
│   ├── App.css
│   ├── main.jsx                   # Punto de entrada
│   └── index.css                  # Estilos globales
├── index.html                     # HTML principal
├── vite.config.js                 # Configuración de Vite
├── package.json
├── .gitignore
├── netlify.toml                   # Configuración Netlify
└── README.md
```

## Comandos Disponibles

### Desarrollo
```bash
npm run dev       # Inicia servidor de desarrollo con hot reload
```

### Build
```bash
npm run build     # Compila para producción en carpeta 'dist'
npm run preview   # Previsualiza el build localmente
```

### Linting
```bash
npm run lint      # Verifica calidad del código
```

## Desarrollo de Features

### Agregar un nuevo elemento 3D

En `ZenGardenCanvas.jsx`, dentro de la función `useEffect`:

```javascript
// Crear geometría
const geometry = new THREE.SphereGeometry(1, 32, 32)

// Crear material
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })

// Crear mesh
const mesh = new THREE.Mesh(geometry, material)
mesh.castShadow = true
mesh.receiveShadow = true

// Agregar a la escena
scene.add(mesh)
```

### Modificar interacción del ratón

El sistema de raycast está en `ZenGardenCanvas.jsx`:

```javascript
const onMouseMove = (event) => {
  // Lógica de movimiento del ratón
}

const onMouseDown = (event) => {
  // Lógica de click
}
```

### Agregar nuevos sonidos

En `SoundControl.jsx`:

```javascript
const playCustomSound = (frequency, duration) => {
  const now = audioContext.currentTime
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()

  osc.frequency.setValueAtTime(frequency, now)
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.01, now + duration)

  osc.connect(gain)
  gain.connect(audioContext.destination)

  osc.start(now)
  osc.stop(now + duration)
}
```

## Debugging

### En VS Code
1. Instalar extensión "Debugger for Chrome"
2. F5 para empezar debugging
3. Breakpoints en el código

### En Navegador
1. Abre Developer Tools (F12)
2. Consola para ver errores
3. Network para revisar assets
4. Performance para profiling

## Git Workflow

```bash
# Crear rama para nueva feature
git checkout -b feature/mi-feature

# Hacer cambios y commits
git add .
git commit -m "Add: descripción de cambios"

# Subir y crear pull request
git push origin feature/mi-feature
```

## Performance Tips

- Limita el número de objetos 3D en la escena
- Usa instancing para múltiples geometrías similares
- Optimiza texturas (tamaño y resolución)
- Usa `requestAnimationFrame` para animaciones suaves
- Evita crear objetos en el loop de animación

## Troubleshooting

### Puerto 3000 en uso
```bash
# Cambiar puerto en vite.config.js
server: {
  port: 3001  // O cualquier otro puerto libre
}
```

### Módulos no encontrados
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Cambios no se reflejan
- Verifica que el servidor esté corriendo
- Limpia cache del navegador (Ctrl+Shift+Del)
- Reinicia el servidor de desarrollo

---

¡Happy coding! 🧘‍♂️
