import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './ZenGardenCanvas.css'

const ZenGardenCanvas = () => {
  const containerRef = useRef(null)
  const rastrillo = useRef(null)
  const cameraRef = useRef(null)
  const rockGroupRef = useRef(new THREE.Group())
  const linesGroupRef = useRef(new THREE.Group())
  const butterflyRef = useRef(null)
  const isDrawingRef = useRef(false)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const controlsRef = useRef({ zoom: 20 })
  const rendererRef = useRef(null)

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
    
    const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 16)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.4,
    })
    const handle = new THREE.Mesh(handleGeometry, handleMaterial)
    handle.position.y = 1
    handle.castShadow = true
    rastrilloGroup.add(handle)

    const proneGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.1)
    const proneMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0a0a0,
      roughness: 0.3,
    })
    const prone = new THREE.Mesh(proneGeometry, proneMaterial)
    prone.position.y = 2
    prone.position.z = 0.3
    prone.castShadow = true
    rastrilloGroup.add(prone)

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

    // ========== INTERACTION FUNCTIONS ==========
    const drawRakeLine = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersection = new THREE.Vector3()
      raycasterRef.current.ray.intersectPlane(plane, intersection)

      if (intersection) {
        const lineGeometry = new THREE.BufferGeometry()
        const points = []
        
        for (let i = 0; i < 8; i++) {
          points.push(
            intersection.x + (Math.random() - 0.5) * 0.4,
            0.01,
            intersection.z + (Math.random() - 0.5) * 0.4
          )
        }
        
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xa89968 })
        const line = new THREE.Line(lineGeometry, lineMaterial)
        linesGroupRef.current.add(line)
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

      if (intersection && rastrillo.current) {
        rastrillo.current.position.copy(intersection)
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

  return <div ref={containerRef} className="zen-garden-canvas"></div>
}

export default ZenGardenCanvas
