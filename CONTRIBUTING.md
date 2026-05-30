# 🤝 Contribuyendo a Zen Garden

¡Gracias por tu interés en contribuir! Este documento te guiará através del proceso.

## Código de Conducta

Este proyecto adhiere a un Código de Conducta inclusivo. Esperamos que todos los participantes se comporten con respeto y profesionalismo.

## Cómo Reportar Bugs

1. Verifica que el bug no ha sido reportado ya en [Issues](../../issues)
2. Si es nuevo, crea un nuevo Issue con:
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Tu navegador y sistema operativo
   - Capturas de pantalla si es relevante

## Sugerencias de Mejora

- Abre un [Discussion](../../discussions) para ideas grandes
- Etiqueta con `enhancement` si es un issue
- Describe el caso de uso y beneficios

## Pull Requests

### Proceso

1. Fork el repositorio
2. Crea una rama para tu feature: `git checkout -b feature/descripcion`
3. Haz commits lógicos y descriptivos
4. Push a tu fork: `git push origin feature/descripcion`
5. Abre un Pull Request describiendo los cambios

### Requisitos

- Código debe seguir el style del proyecto
- Ejecuta `npm run lint` antes de hacer push
- PR debe incluir descripción clara
- No agregar dependencias sin discusión
- Tests o ejemplos si es aplicable

## Style Guide

### JavaScript/React

```javascript
// Usa nombres descriptivos
const handleRastrilloMovement = () => { }

// Imports ordenados
import { useState, useEffect } from 'react'
import * as THREE from 'three'

// Props destructuradas
const Component = ({ prop1, prop2 }) => { }

// Use const por defecto
const variable = value
```

### Commits

```
type(scope): brief description

More detailed explanation if needed.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Ramas

- `main` - Production ready
- `develop` - Development branch
- `feature/nombre` - New features
- `fix/nombre` - Bug fixes
- `docs/nombre` - Documentation

## Areas donde Ayuda es Bienvenida

- [ ] Optimización de performance
- [ ] Nuevos elementos 3D (árboles, agua, puentes)
- [ ] Más tipos de sonidos ambient
- [ ] Mejorar UI/UX
- [ ] Accesibilidad (ARIA, keyboard navigation)
- [ ] Documentación
- [ ] Pruebas
- [ ] Localización (i18n)

## Desarrollo Local

Ver [DEVELOPMENT.md](./DEVELOPMENT.md) para setup local

## Licencia

Al contribuir, aceptas que tu código sea licenciado bajo MIT (ver LICENSE)

## Preguntas?

- Abre una [Discussion](../../discussions)
- Escribe un Issue con la etiqueta `question`

---

**¡Tu contribución hace a Zen Garden mejor! 🌿**
