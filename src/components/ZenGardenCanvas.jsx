import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ZenGardenCanvas.css'

const ZenGardenCanvas = ({ onCharacterDialog = null, currentDialog = null }) => {
  const containerRef = useRef(null)
  const rastrillo = useRef(null)
  const cameraRef = useRef(null)
  const rockGroupRef = useRef(new THREE.Group())
  const linesGroupRef = useRef(new THREE.Group())
  const butterflyRef = useRef(null)
  const characterRef = useRef(null)
  const characterStateRef = useRef({
    targetPos: new THREE.Vector3(0, 0, 0),
    currentDialog: null,
    dialogTime: 0,
    nextDialogTime: Math.random() * 10 + 10, // 10-20 segundos
    walkDirection: new THREE.Vector3(1, 0, 0),
    directionChangeTimer: 0,
  })
  const isDrawingRef = useRef(false)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const controlsRef = useRef({ zoom: 20 })
  const cameraLookAtRef = useRef(new THREE.Vector3(0, 1, 0))
  const rendererRef = useRef(null)
  const lastTouchDistanceRef = useRef(null)
  const lastTouchCenterRef = useRef(null)
  const sandCanvasRef = useRef(null)
  const sandTextureRef = useRef(null)
  const rastrilloTargetRef = useRef(new THREE.Vector3(0, 0.5, 0))
  const lastDrawTimeRef = useRef(0)
  const DRAW_THROTTLE = 20 // ms - dibuja cada 20ms para más continuidad

  useEffect(() => {
    if (!containerRef.current) return

    // ========== SCENE SETUP ==========
    const scene = new THREE.Scene()
    // Warm, artistic background inspired by Monument Valley (peachy-beige at horizon)
    scene.background = new THREE.Color(0x1a1622)
    // Premium atmospheric fog with warm tone
    scene.fog = new THREE.Fog(0x3d3a4a, 60, 180)

    // ========== CAMERA SETUP ==========
    const camera = new THREE.PerspectiveCamera(
      70,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(16, 17, 16)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // ========== RENDERER SETUP - Mobile-Optimized Premium Settings ==========
    // Detect mobile device for optimization
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const pixelRatio = isMobileDevice ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2)
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobileDevice, // Disable antialiasing on mobile for performance
      alpha: true,
      powerPreference: isMobileDevice ? 'low-power' : 'high-performance',
      precision: 'highp'
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(pixelRatio)
    renderer.shadowMap.enabled = true
    
    // Reduce shadow map resolution on mobile for performance
    if (isMobileDevice) {
      renderer.shadowMap.type = THREE.PCFShadowMap
      renderer.shadowMap.resolution = 2048 // Reduced from 4096 for mobile
    } else {
      renderer.shadowMap.type = THREE.PCFShadowMap
      renderer.shadowMap.resolution = 4096
    }
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.webkitTouchCallout = 'none'
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ========== PREMIUM LIGHTING SETUP - Inspired by Monument Valley & Alto ==========
    // Soft warm ambient light for artful aesthetic
    const ambientLight = new THREE.AmbientLight(0xd4a89e, 0.45)
    scene.add(ambientLight)

    // Main directional light - golden hour warmth
    const directionalLight = new THREE.DirectionalLight(0xf5d5a8, 1.1)
    directionalLight.position.set(22, 25, 18)
    directionalLight.target.position.set(0, 0, 0)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 4096
    directionalLight.shadow.mapSize.height = 4096
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    directionalLight.shadow.bias = -0.0005
    scene.add(directionalLight)

    // Fill light - warm subtle light from opposite side (like canyon walls)
    const fillLight = new THREE.DirectionalLight(0xc9a882, 0.35)
    fillLight.position.set(-15, 10, -15)
    scene.add(fillLight)

    // Rim light - creates depth and silhouette
    const rimLight = new THREE.DirectionalLight(0xf0b89a, 0.4)
    rimLight.position.set(-20, 8, 20)
    scene.add(rimLight)

    // Soft point light for atmosphere - warm glow
    const pointLight = new THREE.PointLight(0xf0d5b8, 0.35)
    pointLight.position.set(10, 12, 10)
    pointLight.distance = 60
    scene.add(pointLight)

    // ========== SAND GROUND - Ultra Realistic Texture with Dynamic Updates ==========
    // Create high-quality sand texture using Canvas
    const sandCanvas = document.createElement('canvas')
    sandCanvas.width = 1024
    sandCanvas.height = 1024
    const sandCtx = sandCanvas.getContext('2d')
    
    // Base sand colors (warm, natural Kyoto-inspired palette)
    const baseColor = '#d9c9b0'
    sandCtx.fillStyle = baseColor
    sandCtx.fillRect(0, 0, 1024, 1024)
    
    // Create highly detailed sand grain texture
    const imageData = sandCtx.getImageData(0, 0, 1024, 1024)
    const data = imageData.data
    
    // Perlin-like noise using multiple sine waves for more natural appearance
    for (let i = 0; i < 1024; i++) {
      for (let j = 0; j < 1024; j++) {
        const idx = (i * 1024 + j) * 4
        
        // Multi-scale noise for realistic sand grain pattern
        const noise1 = Math.sin(i * 0.01 + j * 0.008) * 0.5 + 0.5
        const noise2 = Math.sin(i * 0.005 - j * 0.003) * 0.5 + 0.5
        const noise3 = Math.sin(i * 0.002 + j * 0.002) * 0.5 + 0.5
        const combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2)
        
        // Random grain variation
        const randomGrain = Math.random() * 0.3
        const finalNoise = combinedNoise * 0.7 + randomGrain
        
        // Create sand grain variation (brownish tones)
        const variation = (finalNoise - 0.5) * 20
        const r = Math.max(180, Math.min(240, 217 + variation))
        const g = Math.max(165, Math.min(225, 201 + variation * 0.8))
        const b = Math.max(150, Math.min(210, 176 + variation * 0.6))
        
        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        data[idx + 3] = 255
      }
    }
    
    sandCtx.putImageData(imageData, 0, 0)
    
    // Add subtle depth lines and patterns
    sandCtx.strokeStyle = 'rgba(230, 215, 195, 0.08)'
    sandCtx.lineWidth = 1
    for (let i = 0; i < 40; i++) {
      sandCtx.beginPath()
      sandCtx.moveTo(0, i * 25)
      sandCtx.quadraticCurveTo(
        512 + Math.sin(i) * 50,
        i * 25 + 20,
        1024,
        i * 25 + 5
      )
      sandCtx.stroke()
    }
    
    const sandTexture = new THREE.CanvasTexture(sandCanvas)
    sandTexture.magFilter = THREE.LinearFilter
    sandTexture.minFilter = THREE.LinearMipMapLinearFilter
    sandCanvasRef.current = sandCanvas
    sandTextureRef.current = sandTexture
    
    const sandGeometry = new THREE.PlaneGeometry(50, 50)
    const sandMaterial = new THREE.MeshStandardMaterial({
      map: sandTexture,
      color: 0xe8d5bf,
      roughness: 0.82,
      metalness: 0.0,
      side: THREE.DoubleSide,
    })
    const sand = new THREE.Mesh(sandGeometry, sandMaterial)
    sand.rotation.x = -Math.PI / 2
    sand.receiveShadow = true
    sand.position.y = -0.01
    scene.add(sand)

    // Ground plane for better shadows
    const groundShadowGeometry = new THREE.PlaneGeometry(50, 50)
    const groundShadowMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 1.0,
      metalness: 0.0,
    })
    const groundShadow = new THREE.Mesh(groundShadowGeometry, groundShadowMaterial)
    groundShadow.rotation.x = -Math.PI / 2
    groundShadow.receiveShadow = true
    groundShadow.position.y = -0.02
    scene.add(groundShadow)

    // ========== ROCK GROUP ==========
    scene.add(rockGroupRef.current)
    
    // ========== DECORATIVE STONES - Inspired by Kyoto zen gardens ==========
    // Add a few initial stones for visual balance (Zen garden principle)
    const initialStones = [
      { pos: [-8, 0, -5], size: 0.6 },
      { pos: [10, 0, -12], size: 0.5 },
      { pos: [-15, 0, 8], size: 0.7 },
      { pos: [6, 0, 10], size: 0.55 },
      { pos: [0, 0, -18], size: 0.65 }
    ]
    
    initialStones.forEach(stone => {
      const geometry = new THREE.IcosahedronGeometry(stone.size, 3)
      const colors = [0xa0826d, 0xb89968, 0x9d7e6b, 0xc9a870, 0xaa8f73]
      const color = colors[Math.floor(Math.random() * colors.length)]
      const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.72,
        metalness: 0.0,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...stone.pos)
      mesh.position.y = stone.size * 0.5
      mesh.castShadow = true
      mesh.receiveShadow = true
      rockGroupRef.current.add(mesh)
    })

    // ========== RASTRILLO (RAKE) - Premium Design ==========
    const rastrilloGroup = new THREE.Group()
    
    // Handle (mango) - natural wood
    const handleGeometry = new THREE.CylinderGeometry(0.06, 0.055, 2.2, 24)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0865c,
      roughness: 0.5,
      metalness: 0.1,
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.y = 1.1
    handle.castShadow = true
    handle.receiveShadow = true
    rastrilloGroup.add(handle)

    // Rake head - brushed metal
    const rakeHeadGeometry = new THREE.BoxGeometry(2.2, 0.12, 0.2)
    const rakeHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      roughness: 0.35,
      metalness: 0.6,
    })
    const rakeHead = new THREE.Mesh(rakeHeadGeometry, rakeHeadMaterial)
    rakeHead.position.y = 2.1
    rakeHead.position.z = 0.35
    rakeHead.castShadow = true
    rakeHead.receiveShadow = true
    rastrilloGroup.add(rakeHead)

    // Create 4 prominent teeth with tapered design
    const toothGeometry = new THREE.ConeGeometry(0.09, 0.48, 12)
    const toothMaterial = new THREE.MeshStandardMaterial({
      color: 0xb0b0b0,
      roughness: 0.3,
      metalness: 0.65,
    })

    const toothPositions = [-1.0, -0.3, 0.3, 1.0]
    toothPositions.forEach((x) => {
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
      tooth.position.set(x, 1.85, 0.55)
      tooth.rotation.z = Math.PI
      tooth.castShadow = true
      tooth.receiveShadow = true
      rastrilloGroup.add(tooth)
    })

    rastrilloGroup.position.set(0, 0.5, 0)
    scene.add(rastrilloGroup)
    rastrillo.current = rastrilloGroup

    // ========== LINES GROUP ==========
    scene.add(linesGroupRef.current)

    // ========== BUTTERFLY - Artistic Design inspired by Alto & Monument Valley ==========
    const butterflyGroup = new THREE.Group()
    
    const bodyGeometry = new THREE.SphereGeometry(0.12, 16, 16)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9a882, // Warm earth tone
      roughness: 0.5,
      metalness: 0.2,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    body.receiveShadow = true
    butterflyGroup.add(body)

    const wingGeometry = new THREE.BoxGeometry(0.35, 0.24, 0.02)
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xd9b88a, // Soft peachy-tan
      roughness: 0.35,
      metalness: 0.3,
      emissive: 0xc9915f,
      emissiveIntensity: 0.15,
    })

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial)
    leftWing.position.x = -0.18
    leftWing.castShadow = true
    leftWing.receiveShadow = true
    butterflyGroup.add(leftWing)

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial)
    rightWing.position.x = 0.18
    rightWing.castShadow = true
    rightWing.receiveShadow = true
    butterflyGroup.add(rightWing)

    butterflyGroup.position.set(6, 4, 5)
    scene.add(butterflyGroup)
    butterflyRef.current = { 
      group: butterflyGroup, 
      wings: [leftWing, rightWing], 
      time: 0,
      floatSpeed: Math.random() * 0.3 + 0.2,
      floatOffset: Math.random() * Math.PI * 2
    }

    // ========== CHARACTER (JARDINERO / GARDENER) - Friendly & Chubby ==========
    const characterGroup = new THREE.Group()

    // Head (cabeza grande y amigable - tono cálido)
    const charHeadGeometry = new THREE.SphereGeometry(0.5, 20, 20)
    const charHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xa68968, // Warm sand-like tone
      roughness: 0.5,
      metalness: 0.1,
    })
    const charHead = new THREE.Mesh(charHeadGeometry, charHeadMaterial)
    charHead.position.y = 1.4
    charHead.castShadow = true
    charHead.receiveShadow = true
    characterGroup.add(charHead)

    // Hat (sombrero simple de paja)
    const hatBrimGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 32)
    const hatMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.7,
    })
    const hatBrim = new THREE.Mesh(hatBrimGeometry, hatMaterial)
    hatBrim.position.y = 2.05
    hatBrim.castShadow = true
    characterGroup.add(hatBrim)

    const hatTopGeometry = new THREE.ConeGeometry(0.45, 0.5, 32)
    const hatTop = new THREE.Mesh(hatTopGeometry, hatMaterial)
    hatTop.position.y = 2.35
    hatTop.castShadow = true
    characterGroup.add(hatTop)

    // Eyes - happy and kind
    const charEyeGeometry = new THREE.SphereGeometry(0.1, 12, 12)
    const charEyeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      roughness: 0.3,
    })
    const charLeftEye = new THREE.Mesh(charEyeGeometry, charEyeMaterial)
    charLeftEye.position.set(-0.18, 1.6, 0.42)
    characterGroup.add(charLeftEye)
    const charRightEye = new THREE.Mesh(charEyeGeometry, charEyeMaterial)
    charRightEye.position.set(0.18, 1.6, 0.42)
    characterGroup.add(charRightEye)

    // Smile (small line for smile)
    const smileGeometry = new THREE.TorusGeometry(0.12, 0.03, 16, 100, 0, Math.PI)
    const smileMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.4,
    })
    const smile = new THREE.Mesh(smileGeometry, smileMaterial)
    smile.position.set(0, 1.35, 0.48)
    smile.rotation.z = Math.PI
    characterGroup.add(smile)

    // Body (cuerpo gordito - sphere for roundness)
    const charBodyGeometry = new THREE.SphereGeometry(0.4, 20, 20)
    const charBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a7a6b, // Warm greenish tone
      roughness: 0.6,
      metalness: 0.05,
    })
    const charBody = new THREE.Mesh(charBodyGeometry, charBodyMaterial)
    charBody.scale.set(1, 1.2, 0.9) // Make it slightly wider
    charBody.position.y = 0.55
    charBody.castShadow = true
    charBody.receiveShadow = true
    characterGroup.add(charBody)

    // Arms (más gordos y cortos para verse amigable)
    const charArmGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.5, 12)
    const charArmMaterial = new THREE.MeshStandardMaterial({
      color: 0xa68968,
      roughness: 0.55,
      metalness: 0.1,
    })
    
    const charLeftArm = new THREE.Mesh(charArmGeometry, charArmMaterial)
    charLeftArm.position.set(-0.5, 0.9, 0)
    charLeftArm.rotation.z = 0.4
    charLeftArm.castShadow = true
    charLeftArm.receiveShadow = true
    characterGroup.add(charLeftArm)

    const charRightArm = new THREE.Mesh(charArmGeometry, charArmMaterial)
    charRightArm.position.set(0.5, 0.9, 0)
    charRightArm.rotation.z = -0.4
    charRightArm.castShadow = true
    charRightArm.receiveShadow = true
    characterGroup.add(charRightArm)

    // Legs (más cortos)
    const charLegGeometry = new THREE.CylinderGeometry(0.12, 0.1, 0.35, 12)
    const charLegMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5a4b,
      roughness: 0.6,
      metalness: 0.05,
    })

    const charLeftLeg = new THREE.Mesh(charLegGeometry, charLegMaterial)
    charLeftLeg.position.set(-0.18, 0.1, 0)
    charLeftLeg.castShadow = true
    charLeftLeg.receiveShadow = true
    characterGroup.add(charLeftLeg)

    const charRightLeg = new THREE.Mesh(charLegGeometry, charLegMaterial)
    charRightLeg.position.set(0.18, 0.1, 0)
    charRightLeg.castShadow = true
    charRightLeg.receiveShadow = true
    characterGroup.add(charRightLeg)

    // RAKE TOOL IN HAND - Character will hold and use the rake
    const charRakeGroup = new THREE.Group()
    
    // Rake handle
    const charRakeHandleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 16)
    const charRakeMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.5,
    })
    const charRakeHandle = new THREE.Mesh(charRakeHandleGeometry, charRakeMaterial)
    charRakeHandle.position.y = 0.3
    charRakeHandle.castShadow = true
    charRakeGroup.add(charRakeHandle)

    // Rake head
    const charRakeHeadGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.15)
    const charRakeHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xb0b0b0,
      roughness: 0.35,
      metalness: 0.6,
    })
    const charRakeHead = new THREE.Mesh(charRakeHeadGeometry, charRakeHeadMaterial)
    charRakeHead.position.y = 1.3
    charRakeHead.position.z = 0.2
    charRakeHead.castShadow = true
    charRakeGroup.add(charRakeHead)

    // Rake teeth
    const rakeToothGeometry = new THREE.ConeGeometry(0.06, 0.35, 8)
    const rakeToothMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0a0a0,
      roughness: 0.3,
      metalness: 0.65,
    })
    const charRakeToothPositions = [-0.6, -0.2, 0.2, 0.6]
    charRakeToothPositions.forEach((x) => {
      const tooth = new THREE.Mesh(rakeToothGeometry, rakeToothMaterial)
      tooth.position.set(x, 1.05, 0.35)
      tooth.rotation.z = Math.PI
      tooth.castShadow = true
      charRakeGroup.add(tooth)
    })

    // Position rake in right hand
    charRakeGroup.position.set(0.35, 0.9, 0.2)
    charRakeGroup.rotation.z = -0.3
    characterGroup.add(charRakeGroup)

    characterGroup.position.set(-11, 0, -11)
    scene.add(characterGroup)
    characterRef.current = { 
      group: characterGroup, 
      arms: [charLeftArm, charRightArm],
      legs: [charLeftLeg, charRightLeg],
      head: charHead,
      rakeGroup: charRakeGroup,
      time: 0 
    }

    // ========== INTERACTION FUNCTIONS ==========
    const lastRakePosition = new THREE.Vector3(0, 0, 0)

    const drawRakeLine = () => {
      const now = Date.now()
      if (now - lastDrawTimeRef.current < DRAW_THROTTLE) return
      lastDrawTimeRef.current = now

      if (rastrillo.current) {
        const rakePos = rastrillo.current.position.clone()
        
        // Calculate distance moved since last draw
        const distance = rakePos.distanceTo(lastRakePosition)
        if (distance < 0.01) return
        
        // Create multiple interpolation points for smooth continuous lines
        const numInterpolationSteps = Math.max(1, Math.ceil(distance / 0.15))
        const interpolationPoints = []
        
        for (let step = 0; step <= numInterpolationSteps; step++) {
          const t = numInterpolationSteps > 0 ? step / numInterpolationSteps : 0
          const interpolatedPos = lastRakePosition.clone().lerp(rakePos, t)
          interpolationPoints.push(interpolatedPos)
        }

        // Draw 3 parallel lines (rake teeth) with smooth interpolation
        const lineSpacing = 1.1
        const lineLength = 0.6

        // Draw line geometry for each interpolated point
        for (let i = 0; i < interpolationPoints.length - 1; i++) {
          const startRakePos = interpolationPoints[i]
          const endRakePos = interpolationPoints[i + 1]
          const direction = endRakePos.clone().sub(startRakePos).normalize()

          for (let toothIndex = -1; toothIndex <= 1; toothIndex += 1) {
            const lineGeometry = new THREE.BufferGeometry()
            const points = []
            const colors = []

            // Offset perpendicular to rake direction
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize()
            const offset = perpendicular.multiplyScalar(toothIndex * lineSpacing * 0.5)

            // Start and end points of the line
            const lineStart = startRakePos.clone().add(offset).sub(direction.clone().multiplyScalar(lineLength * 0.5))
            const lineEnd = endRakePos.clone().add(offset).add(direction.clone().multiplyScalar(lineLength * 0.5))

            lineStart.y = 0.008
            lineEnd.y = 0.008

            points.push(
              lineStart.x, lineStart.y, lineStart.z,
              lineEnd.x, lineEnd.y, lineEnd.z
            )

            // Sand-colored rake marks - subtle fade
            const startColor = new THREE.Color(0xb39d7f) // Lighter sand
            const endColor = new THREE.Color(0x9a7b63) // Darker groove
            
            colors.push(startColor.r, startColor.g, startColor.b)
            colors.push(endColor.r, endColor.g, endColor.b)

            lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
            lineGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
            
            const lineMaterial = new THREE.LineBasicMaterial({
              vertexColors: true,
              linewidth: 12, // Slightly thicker for better visibility
              fog: true,
              transparent: true,
              opacity: 0.85,
            })
            const line = new THREE.Line(lineGeometry, lineMaterial)
            line.frustumCulled = false
            linesGroupRef.current.add(line)
          }
        }

        // Update sand texture dynamically with smooth curves
        if (sandCanvasRef.current && sandTextureRef.current) {
          const ctx = sandCanvasRef.current.getContext('2d')
          const scale = 1024 / 50
          
          // Draw smooth curve through all interpolation points
          for (let toothIndex = -1; toothIndex <= 1; toothIndex += 1) {
            // Draw shadow line (depth)
            ctx.strokeStyle = 'rgba(130, 110, 90, 0.3)'
            ctx.lineWidth = 8
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.beginPath()
            
            for (let i = 0; i < interpolationPoints.length; i++) {
              const pos = interpolationPoints[i]
              const perpendicular = i > 0 ? 
                interpolationPoints[i].clone().sub(interpolationPoints[i-1]).normalize() :
                interpolationPoints[1].clone().sub(interpolationPoints[0]).normalize()
              const offset = new THREE.Vector3(-perpendicular.z, 0, perpendicular.x).normalize()
                .multiplyScalar(toothIndex * 1.1 * 0.5)
              
              const canvasX = (pos.x + offset.x + 25) * scale
              const canvasY = (pos.z + offset.z + 25) * scale
              
              if (i === 0) {
                ctx.moveTo(canvasX, canvasY)
              } else {
                ctx.lineTo(canvasX, canvasY)
              }
            }
            ctx.stroke()
            
            // Draw highlight line (groove top)
            ctx.strokeStyle = 'rgba(220, 200, 175, 0.18)'
            ctx.lineWidth = 3
            ctx.beginPath()
            
            for (let i = 0; i < interpolationPoints.length; i++) {
              const pos = interpolationPoints[i]
              const perpendicular = i > 0 ? 
                interpolationPoints[i].clone().sub(interpolationPoints[i-1]).normalize() :
                interpolationPoints[1].clone().sub(interpolationPoints[0]).normalize()
              const offset = new THREE.Vector3(-perpendicular.z, 0, perpendicular.x).normalize()
                .multiplyScalar(toothIndex * 1.1 * 0.5)
              
              const canvasX = (pos.x + offset.x + 25) * scale + 1
              const canvasY = (pos.z + offset.z + 25) * scale + 1
              
              if (i === 0) {
                ctx.moveTo(canvasX, canvasY)
              } else {
                ctx.lineTo(canvasX, canvasY)
              }
            }
            ctx.stroke()
          }
          
          sandTextureRef.current.needsUpdate = true
        }

        // Update last position
        lastRakePosition.copy(rakePos)
      }
    }

    const placeRock = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersection = new THREE.Vector3()
      raycasterRef.current.ray.intersectPlane(plane, intersection)

      if (intersection) {
        const rockSize = Math.random() * 0.5 + 0.25
        const rockGeometry = new THREE.IcosahedronGeometry(rockSize, 4)
        
        // Warm natural stone palette inspired by Kyoto zen gardens
        const rockColors = [0xa0826d, 0xb89968, 0x9d7e6b, 0xc9a870, 0xaa8f73, 0xb39d7f, 0x9a7b63]
        const randomColor = rockColors[Math.floor(Math.random() * rockColors.length)]
        
        const rockMaterial = new THREE.MeshStandardMaterial({
          color: randomColor,
          roughness: 0.72 + Math.random() * 0.15,
          metalness: 0.05,
          side: THREE.DoubleSide,
        })
        const rock = new THREE.Mesh(rockGeometry, rockMaterial)
        rock.position.copy(intersection)
        rock.position.y = rockSize * 0.6
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )
        rock.castShadow = true
        rock.receiveShadow = true
        
        rockGroupRef.current.add(rock)
      }
    }

    const updateRakePosition = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersection = new THREE.Vector3()
      raycasterRef.current.ray.intersectPlane(plane, intersection)

      if (intersection) {
        // Clamp target to garden bounds (40x40 sand = ±20)
        rastrilloTargetRef.current.x = Math.max(-20, Math.min(20, intersection.x))
        rastrilloTargetRef.current.z = Math.max(-20, Math.min(20, intersection.z))
      }
    }

    // ========== EVENT LISTENERS ==========
    const updatePointerFromEvent = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onPointerMove = (event) => {
      if (event.pointerType === 'touch' && event.isPrimary === false) return
      updatePointerFromEvent(event)
      updateRakePosition()

      if (isDrawingRef.current) {
        drawRakeLine()
      }
    }

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button === 2) {
        event.preventDefault()
        placeRock()
        return
      }

      if (event.pointerType === 'mouse' && event.button !== 0) return

      event.preventDefault()
      updatePointerFromEvent(event)
      isDrawingRef.current = true
      updateRakePosition()
      drawRakeLine()
    }

    const onPointerUp = () => {
      isDrawingRef.current = false
    }

    const onWheel = (event) => {
      event.preventDefault()
      controlsRef.current.zoom += event.deltaY > 0 ? 1 : -1
      controlsRef.current.zoom = Math.max(5, Math.min(50, controlsRef.current.zoom))
    }

    const onContextMenu = (event) => {
      event.preventDefault()
    }

    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('pointerleave', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, false)
    renderer.domElement.addEventListener('contextmenu', onContextMenu)

    // ========== ANIMATION LOOP ==========
    const animate = () => {
      requestAnimationFrame(animate)

      // Update character (jardinero)
      if (characterRef.current) {
        const charState = characterStateRef.current
        charState.time += 0.016 // ~60fps

        // Change direction every 8-12 seconds (slower movement)
        charState.directionChangeTimer += 0.016
        if (charState.directionChangeTimer > Math.random() * 4 + 8) {
          const angle = Math.random() * Math.PI * 2
          charState.walkDirection.set(Math.cos(angle), 0, Math.sin(angle))
          charState.directionChangeTimer = 0
        }

        // Move character slowly across garden (very slow meditative pace)
        const speed = 0.8 // Slower movement - units per second
        const movement = charState.walkDirection.clone().multiplyScalar(speed * 0.016)
        characterRef.current.group.position.add(movement)

        // Keep character within bounds
        const maxBound = 18
        characterRef.current.group.position.x = Math.max(-maxBound, Math.min(maxBound, characterRef.current.group.position.x))
        characterRef.current.group.position.z = Math.max(-maxBound, Math.min(maxBound, characterRef.current.group.position.z))

        // Animate arms and rake swinging while raking
        const rakeSwing = Math.sin(charState.time * 3) * 0.4 // Slower swing for raking motion
        characterRef.current.arms[0].rotation.z = 0.4 + rakeSwing
        characterRef.current.arms[1].rotation.z = -0.4 - rakeSwing

        // Animate rake creating patterns while character walks
        if (characterRef.current.rakeGroup) {
          // Make rake swing forward and back as if raking
          characterRef.current.rakeGroup.rotation.z = -0.3 + Math.sin(charState.time * 3) * 0.3
          // Occasionally draw lines from the character's rake (every 0.5 seconds)
          if (Math.sin(charState.time * 2) > 0.8) {
            // Position rake at character's position and draw
            const charPos = characterRef.current.group.position.clone()
            const rakeDrawPos = charPos.clone().add(charState.walkDirection.clone().multiplyScalar(0.5))
            rastrillo.current.position.copy(rakeDrawPos)
            drawRakeLine()
          }
        }

        // Animate legs walking motion
        const legSwing = Math.sin(charState.time * 5) * 0.2
        characterRef.current.legs[0].rotation.z = legSwing * 0.5
        characterRef.current.legs[1].rotation.z = -legSwing * 0.5

        // Head looks in walking direction
        characterRef.current.head.rotation.y = Math.atan2(charState.walkDirection.x, charState.walkDirection.z)

        // Dialog system - show dialog every 10-20 seconds
        charState.dialogTime += 0.016
        if (charState.dialogTime > charState.nextDialogTime) {
          if (onCharacterDialog) {
            onCharacterDialog()
          }
          charState.dialogTime = 0
          charState.nextDialogTime = Math.random() * 10 + 10
        }
      }

      // Update butterfly with floating animation
      if (butterflyRef.current) {
        butterflyRef.current.time += 0.016
        const time = butterflyRef.current.time + butterflyRef.current.floatOffset
        
        // Smooth figure-8 flight pattern
        butterflyRef.current.group.position.x = 6 + Math.sin(time * 0.4) * 4
        butterflyRef.current.group.position.y = 4.5 + Math.sin(time * 0.25) * 1.2
        butterflyRef.current.group.position.z = 6 + Math.cos(time * 0.3) * 3.5

        // Smooth wing flapping
        const wingFlap = Math.sin(time * 8) * 0.6
        butterflyRef.current.wings[0].rotation.z = wingFlap
        butterflyRef.current.wings[1].rotation.z = -wingFlap
        
        // Body rotation follows direction
        butterflyRef.current.group.rotation.y = Math.atan2(
          Math.sin(time * 0.3),
          Math.cos(time * 0.4)
        )
      }

      // Update rake position smoothly (with delay/lag)
      if (rastrillo.current) {
        rastrillo.current.position.lerp(rastrilloTargetRef.current, 0.15)
      }

      // Update camera
      const targetCameraDistance = controlsRef.current.zoom
      const cameraOffset = new THREE.Vector3(15, 15, 15).normalize().multiplyScalar(targetCameraDistance)
      const targetPos = cameraOffset.add(cameraLookAtRef.current)
      camera.position.lerp(targetPos, 0.1)
      camera.lookAt(cameraLookAtRef.current)

      renderer.render(scene, camera)
    }

    animate()

    // ========== WINDOW RESIZE ==========
    const handleResize = () => {
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // ========== CLEANUP ==========
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointerleave', onPointerUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      renderer.domElement.removeEventListener('contextmenu', onContextMenu)
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} className="zen-garden-canvas"></div>
      {currentDialog && (
        <div className="character-dialog">
          {currentDialog}
        </div>
      )}
    </div>
  )
}

export default ZenGardenCanvas
