import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './ZenGardenCanvas.css'

const ZenGardenCanvas = () => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const rastrillo = useRef(null)
  const sandRef = useRef(null)
  const rockGroupRef = useRef(new THREE.Group())
  const butterflyRef = useRef(null)
  const linesGroupRef = useRef(new THREE.Group())
  const isDrawingRef = useRef(false)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const cameraRef = useRef(null)
  const controlsRef = useRef({ x: 0, y: 0, zoom: 1 })

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x1a2332)
    scene.fog = new THREE.Fog(0x1a2332, 50, 200)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(15, 15, 15)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(20, 20, 20)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.far = 50
    scene.add(directionalLight)

    // Create sand ground
    const sandGeometry = new THREE.PlaneGeometry(40, 40)
    const sandMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4c4a8,
      roughness: 0.7,
      metalness: 0,
      displacementScale: 0.1,
    })
    const sand = new THREE.Mesh(sandGeometry, sandMaterial)
    sand.rotation.x = -Math.PI / 2
    sand.receiveShadow = true
    sand.castShadow = true
    scene.add(sand)
    sandRef.current = sand

    // Create rocks
    const rocksContainer = rockGroupRef.current
    scene.add(rocksContainer)

    // Create rastrillo (rake)
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

    // Create butterfly
    const butterflyGroup = new THREE.Group()
    const bodyGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6b9d,
      roughness: 0.5,
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    butterflyGroup.add(body)

    // Wings
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

    // Lines group for rake marks
    scene.add(linesGroupRef.current)

    // Mouse events
    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Update rake position
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersection = raycasterRef.current.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
      if (intersection && rastrillo.current) {
        rastrillo.current.position.copy(intersection)
      }

      if (isDrawingRef.current) {
        drawRakeLine()
      }
    }

    const onMouseDown = (event) => {
      if (event.button === 0) { // Left click - draw
        isDrawingRef.current = true
        drawRakeLine()
      } else if (event.button === 2) { // Right click - place rock
        placeRock()
      }
    }

    const onMouseUp = () => {
      isDrawingRef.current = false
    }

    const onMouseWheel = (event) => {
      event.preventDefault()
      controlsRef.current.zoom += event.deltaY > 0 ? -1 : 1
      controlsRef.current.zoom = Math.max(5, Math.min(50, controlsRef.current.zoom))
    }

    const drawRakeLine = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersection = raycasterRef.current.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
      
      if (intersection) {
        const lineGeometry = new THREE.BufferGeometry()
        const points = []
        for (let i = 0; i < 8; i++) {
          points.push(
            intersection.x + (Math.random() - 0.5) * 0.3,
            0.01,
            intersection.z + (Math.random() - 0.5) * 0.3
          )
        }
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
        
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0xa89968,
          linewidth: 2,
        })
        const line = new THREE.Line(lineGeometry, lineMaterial)
        linesGroupRef.current.add(line)
      }
    }

    const placeRock = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const intersection = raycasterRef.current.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
      
      if (intersection) {
        // Crear piedra con forma y tamaño aleatorio
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

    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault())
    renderer.domElement.addEventListener('wheel', onMouseWheel, false)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      // Update butterfly
      if (butterflyRef.current) {
        butterflyRef.current.time += 0.02
        butterflyRef.current.group.position.y = 3 + Math.sin(butterflyRef.current.time * 0.5) * 0.5
        butterflyRef.current.group.position.x = 5 + Math.cos(butterflyRef.current.time * 0.3) * 3
        butterflyRef.current.group.position.z = 5 + Math.sin(butterflyRef.current.time * 0.4) * 2

        // Wing animation
        butterflyRef.current.wings.forEach((wing) => {
          wing.rotation.z = Math.sin(butterflyRef.current.time * 10) * 0.5
        })
      }

      // Update camera with smooth transitions
      const targetCameraZ = 20 + controlsRef.current.zoom
      const targetCameraX = 15 + controlsRef.current.x
      const targetCameraY = 15 + controlsRef.current.y

      camera.position.lerp(
        new THREE.Vector3(targetCameraX, targetCameraY, targetCameraZ),
        0.1
      )
      camera.lookAt(0, 1, 0)

      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      renderer.domElement.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('contextmenu', (e) => e.preventDefault())
      renderer.domElement.removeEventListener('wheel', onMouseWheel)
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} className="zen-garden-canvas"></div>
}

export default ZenGardenCanvas
