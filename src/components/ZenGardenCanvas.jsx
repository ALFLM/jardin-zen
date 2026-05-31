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
  const rendererRef = useRef(null)
  const rastrilloTargetRef = useRef(new THREE.Vector3(0, 0.5, 0))
  const lastDrawTimeRef = useRef(0)
  const DRAW_THROTTLE = 50 // ms - dibuja cada 50ms para no saturar

  useEffect(() => {
    if (!containerRef.current) return

    // ========== SCENE SETUP ==========
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a2332)
    scene.fog = new THREE.Fog(0x1a2332, 50, 200)

    // ========== CAMERA SETUP ==========
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(15, 15, 15)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // ========== RENDERER SETUP ==========
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ========== LIGHTING ==========
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(20, 20, 20)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.far = 50
    scene.add(directionalLight)

    // ========== SAND GROUND ==========
    const sandGeometry = new THREE.PlaneGeometry(40, 40)
    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4c4a8,
      roughness: 0.7,
      metalness: 0,
    })
    const sand = new THREE.Mesh(sandGeometry, sandMaterial)
    sand.rotation.x = -Math.PI / 2
    sand.receiveShadow = true
    sand.castShadow = true
    scene.add(sand)

    // ========== ROCK GROUP ==========
    scene.add(rockGroupRef.current)

    // ========== RASTRILLO (RAKE) ==========
    const rastrilloGroup = new THREE.Group()
    
    // Handle (mango)
    const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 16)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.4,
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.y = 1
    handle.castShadow = true
    rastrilloGroup.add(handle)

    // Rake head (cabeza del rastrillo con 3 dientes)
    const rakeHeadGeometry = new THREE.BoxGeometry(2, 0.1, 0.15)
    const rakeHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0a0a0,
      roughness: 0.3,
    })
    const rakeHead = new THREE.Mesh(rakeHeadGeometry, rakeHeadMaterial)
    rakeHead.position.y = 2
    rakeHead.position.z = 0.3
    rakeHead.castShadow = true
    rastrilloGroup.add(rakeHead)

    // Create 3 teeth for visual effect
    const toothGeometry = new THREE.ConeGeometry(0.08, 0.4, 8)
    const toothMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.4,
    })

    const toothPositions = [-0.8, 0, 0.8]
    toothPositions.forEach((x) => {
      const tooth = new THREE.Mesh(toothGeometry, toothMaterial)
      tooth.position.set(x, 1.8, 0.5)
      tooth.rotation.z = Math.PI
      tooth.castShadow = true
      rastrilloGroup.add(tooth)
    })

    rastrilloGroup.position.set(0, 0.5, 0)
    scene.add(rastrilloGroup)
    rastrillo.current = rastrilloGroup

    // ========== LINES GROUP ==========
    scene.add(linesGroupRef.current)

    // ========== BUTTERFLY ==========
    const butterflyGroup = new THREE.Group()
    
    const bodyGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b9d,
      roughness: 0.5,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    butterflyGroup.add(body)

    const wingGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.02)
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xff69b4,
      roughness: 0.3,
      emissive: 0xff1493,
      emissiveIntensity: 0.3,
    })

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial)
    leftWing.position.x = -0.15
    leftWing.castShadow = true
    butterflyGroup.add(leftWing)

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial)
    rightWing.position.x = 0.15
    rightWing.castShadow = true
    butterflyGroup.add(rightWing)

    butterflyGroup.position.set(5, 3, 5)
    scene.add(butterflyGroup)
    butterflyRef.current = { group: butterflyGroup, wings: [leftWing, rightWing], time: 0 }

    // ========== CHARACTER (JARDINERO / GARDENER) ==========
    const characterGroup = new THREE.Group()

    // Head (cabeza redonda gris)
    const charHeadGeometry = new THREE.SphereGeometry(0.4, 16, 16)
    const charHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.6,
    })
    const charHead = new THREE.Mesh(charHeadGeometry, charHeadMaterial)
    charHead.position.y = 1.2
    charHead.castShadow = true
    characterGroup.add(charHead)

    // Eyes (dos pequeños ojos negros)
    const charEyeGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const charEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 })
    const charLeftEye = new THREE.Mesh(charEyeGeometry, charEyeMaterial)
    charLeftEye.position.set(-0.15, 1.4, 0.35)
    characterGroup.add(charLeftEye)
    const charRightEye = new THREE.Mesh(charEyeGeometry, charEyeMaterial)
    charRightEye.position.set(0.15, 1.4, 0.35)
    characterGroup.add(charRightEye)

    // Body (cuerpo cilíndrico gris oscuro)
    const charBodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16)
    const charBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x707070,
      roughness: 0.6,
    })
    const charBody = new THREE.Mesh(charBodyGeometry, charBodyMaterial)
    charBody.position.y = 0.5
    charBody.castShadow = true
    characterGroup.add(charBody)

    // Arms (dos brazos)
    const charArmGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8)
    const charArmMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.6,
    })
    
    const charLeftArm = new THREE.Mesh(charArmGeometry, charArmMaterial)
    charLeftArm.position.set(-0.35, 0.8, 0)
    charLeftArm.rotation.z = 0.3
    charLeftArm.castShadow = true
    characterGroup.add(charLeftArm)

    const charRightArm = new THREE.Mesh(charArmGeometry, charArmMaterial)
    charRightArm.position.set(0.35, 0.8, 0)
    charRightArm.rotation.z = -0.3
    charRightArm.castShadow = true
    characterGroup.add(charRightArm)

    // Legs (dos piernas pequeñas)
    const charLegGeometry = new THREE.CylinderGeometry(0.1, 0.08, 0.4, 8)
    const charLegMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      roughness: 0.6,
    })

    const charLeftLeg = new THREE.Mesh(charLegGeometry, charLegMaterial)
    charLeftLeg.position.set(-0.15, 0.1, 0)
    charLeftLeg.castShadow = true
    characterGroup.add(charLeftLeg)

    const charRightLeg = new THREE.Mesh(charLegGeometry, charLegMaterial)
    charRightLeg.position.set(0.15, 0.1, 0)
    charRightLeg.castShadow = true
    characterGroup.add(charRightLeg)

    characterGroup.position.set(-10, 0, -10)
    scene.add(characterGroup)
    characterRef.current = { 
      group: characterGroup, 
      arms: [charLeftArm, charRightArm],
      legs: [charLeftLeg, charRightLeg],
      head: charHead,
      time: 0 
    }

    // ========== INTERACTION FUNCTIONS ==========
    const lastRakePosition = new THREE.Vector3(0, 0, 0)

    const drawRakeLine = () => {
      const now = Date.now()
      if (now - lastDrawTimeRef.current < DRAW_THROTTLE) return
      lastDrawTimeRef.current = now

      if (rastrillo.current) {
        // Get current rake position
        const rakePos = rastrillo.current.position.clone()

        // Calculate direction from last position to current (for trailing effect)
        const direction = rakePos.clone().sub(lastRakePosition).normalize()
        
        // If direction is too small, skip (no movement)
        if (direction.length() < 0.01) return

        // Draw 3 parallel lines (one for each tooth)
        const lineSpacing = 0.8
        const lineLength = 1.5

        for (let toothIndex = -1; toothIndex <= 1; toothIndex++) {
          const lineGeometry = new THREE.BufferGeometry()
          const points = []

          // Offset perpendicular to rake direction
          const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize()
          const offset = perpendicular.multiplyScalar(toothIndex * lineSpacing * 0.5)

          // Start and end points of the line
          const startPoint = rakePos.clone().add(offset).sub(direction.clone().multiplyScalar(lineLength * 0.5))
          const endPoint = rakePos.clone().add(offset).add(direction.clone().multiplyScalar(lineLength * 0.5))

          startPoint.y = 0.01
          endPoint.y = 0.01

          points.push(
            startPoint.x, startPoint.y, startPoint.z,
            endPoint.x, endPoint.y, endPoint.z
          )

          lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
          
          // Gradient color from light to darker brown
          const lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color().setHSL(0.08, 0.3, 0.4),
            linewidth: 3,
          })
          const line = new THREE.Line(lineGeometry, lineMaterial)
          linesGroupRef.current.add(line)
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
        const rockSize = Math.random() * 0.4 + 0.2
        const rockGeometry = new THREE.IcosahedronGeometry(rockSize, 3)
        const rockMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0, 0, Math.random() * 0.3 + 0.3),
          roughness: 0.8,
          metalness: 0,
        })
        const rock = new THREE.Mesh(rockGeometry, rockMaterial)
        rock.position.copy(intersection)
        rock.position.y = rockSize * 0.8
        rock.rotation.x = Math.random() * Math.PI
        rock.rotation.z = Math.random() * Math.PI
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
    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      updateRakePosition()

      if (isDrawingRef.current) {
        drawRakeLine()
      }
    }

    const onMouseDown = (event) => {
      if (event.button === 0) {
        // Left click - draw
        isDrawingRef.current = true
        drawRakeLine()
      } else if (event.button === 2) {
        // Right click - place rock
        event.preventDefault()
        placeRock()
      }
    }

    const onMouseUp = () => {
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

    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel, false)
    renderer.domElement.addEventListener('contextmenu', onContextMenu)

    // ========== ANIMATION LOOP ==========
    const animate = () => {
      requestAnimationFrame(animate)

      // Update character (jardinero)
      if (characterRef.current) {
        const charState = characterStateRef.current
        charState.time += 0.016 // ~60fps

        // Change direction every 5-10 seconds
        charState.directionChangeTimer += 0.016
        if (charState.directionChangeTimer > Math.random() * 5 + 5) {
          const angle = Math.random() * Math.PI * 2
          charState.walkDirection.set(Math.cos(angle), 0, Math.sin(angle))
          charState.directionChangeTimer = 0
        }

        // Move character slowly across garden
        const speed = 1.5 // units per second
        const movement = charState.walkDirection.clone().multiplyScalar(speed * 0.016)
        characterRef.current.group.position.add(movement)

        // Keep character within bounds
        const maxBound = 18
        characterRef.current.group.position.x = Math.max(-maxBound, Math.min(maxBound, characterRef.current.group.position.x))
        characterRef.current.group.position.z = Math.max(-maxBound, Math.min(maxBound, characterRef.current.group.position.z))

        // Animate arms swinging while walking
        const armSwing = Math.sin(charState.time * 5) * 0.3
        characterRef.current.arms[0].rotation.z = 0.3 + armSwing
        characterRef.current.arms[1].rotation.z = -0.3 - armSwing

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

      // Update butterfly
      if (butterflyRef.current) {
        butterflyRef.current.time += 0.02
        const time = butterflyRef.current.time
        butterflyRef.current.group.position.y = 3 + Math.sin(time * 0.5) * 0.5
        butterflyRef.current.group.position.x = 5 + Math.cos(time * 0.3) * 3
        butterflyRef.current.group.position.z = 5 + Math.sin(time * 0.4) * 2

        butterflyRef.current.wings.forEach((wing) => {
          wing.rotation.z = Math.sin(time * 10) * 0.5
        })
      }

      // Update rake position smoothly (with delay/lag)
      if (rastrillo.current) {
        rastrillo.current.position.lerp(rastrilloTargetRef.current, 0.15)
      }

      // Update camera
      const targetCameraDistance = controlsRef.current.zoom
      const targetPos = new THREE.Vector3(15, 15, 15).normalize().multiplyScalar(targetCameraDistance)
      camera.position.lerp(targetPos, 0.1)
      camera.lookAt(0, 1, 0)

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
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
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
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#d4c4a8',
            padding: '15px 25px',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '14px',
            lineHeight: '1.5',
            zIndex: 100,
            animation: 'fadeInOut 3s ease-in-out',
          }}
        >
          {currentDialog}
        </div>
      )}
    </div>
  )
}

export default ZenGardenCanvas
