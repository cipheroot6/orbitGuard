"use client"

import { useEffect, useRef, useCallback } from "react"
import * as THREE from "three"
import { propagateMany, generateOrbitTrace, parseTLE } from "@/lib/orbital/propagator"
import { EARTH_RADIUS_SCENE } from "@/lib/constants"
import type { RiskLevel } from "@/types"

interface DebrisPoint {
  noradId: number
  tleLine1: string
  tleLine2: string
  periodMinutes: number | null
  riskLevel: RiskLevel
}

interface OrbitalSceneProps {
  debris: DebrisPoint[]
  selectedNoradId: number | null
  onSelect: (noradId: number | null) => void
}

const RISK_COLORS: Record<RiskLevel, number> = {
  LOW: 0x00ff88,
  MEDIUM: 0xffcc00,
  HIGH: 0xff6600,
  CRITICAL: 0xff0000,
}

export default function OrbitalScene({
  debris,
  selectedNoradId,
  onSelect,
}: OrbitalSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animFrameRef = useRef<number>(0)
  const orbitLineRef = useRef<THREE.Line | null>(null)
  const isDragging = useRef(false)
  const prevMouse = useRef({ x: 0, y: 0 })
  const cameraAngle = useRef({ theta: 0, phi: Math.PI / 4 })
  const cameraRadius = useRef(3.5)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000008)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.01,
      100
    )
    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Starfield
    const starGeo = new THREE.BufferGeometry()
    const starPositions = new Float32Array(3000)
    for (let i = 0; i < 3000; i++) {
      starPositions[i] = (Math.random() - 0.5) * 80
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 })
    )
    scene.add(stars)

    // Earth sphere
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS_SCENE, 64, 64)
    const earthTexture = new THREE.TextureLoader().load("/textures/earth.jpg")
    const earthMat = new THREE.MeshPhongMaterial({ map: earthTexture })
    const earth = new THREE.Mesh(earthGeo, earthMat)
    scene.add(earth)

    // Atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS_SCENE * 1.015, 64, 64)
    const atmoMat = new THREE.MeshPhongMaterial({
      color: 0x0044aa,
      transparent: true,
      opacity: 0.12,
      side: THREE.FrontSide,
    })
    scene.add(new THREE.Mesh(atmoGeo, atmoMat))

    // Lighting
    scene.add(new THREE.AmbientLight(0x333355, 0.5))
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(5, 3, 5)
    scene.add(sun)

    // Debris points
    const positions = propagateMany(debris)
    const geo = new THREE.BufferGeometry()
    const posArray = new Float32Array(debris.length * 3)
    const colorArray = new Float32Array(debris.length * 3)

    debris.forEach((obj, i) => {
      const pos = positions.get(obj.noradId)
      if (pos) {
        posArray[i * 3] = pos.x
        posArray[i * 3 + 1] = pos.y
        posArray[i * 3 + 2] = pos.z
      }
      const color = new THREE.Color(RISK_COLORS[obj.riskLevel])
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b
    })

    geo.setAttribute("position", new THREE.BufferAttribute(posArray, 3))
    geo.setAttribute("color", new THREE.BufferAttribute(colorArray, 3))

    const pointsMat = new THREE.PointsMaterial({
      size: 0.004,
      vertexColors: true,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geo, pointsMat)
    points.name = "debris-cloud"
    scene.add(points)

    // Animation loop — rotates Earth slowly
    const clock = new THREE.Clock()
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate)
      earth.rotation.y += 0.0002
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener("resize", onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [debris])

  // Draw orbit trace for selected object
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    // Remove previous orbit line
    if (orbitLineRef.current) {
      scene.remove(orbitLineRef.current)
      orbitLineRef.current = null
    }

    if (!selectedNoradId) return

    const obj = debris.find((d) => d.noradId === selectedNoradId)
    if (!obj || !obj.periodMinutes) return

    const trace = generateOrbitTrace(
      { line1: obj.tleLine1, line2: obj.tleLine2 },
      obj.periodMinutes
    )

    const traceGeo = new THREE.BufferGeometry()
    const tracePoints = trace.map((p) => new THREE.Vector3(p.x, p.y, p.z))
    traceGeo.setFromPoints(tracePoints)

    const traceMat = new THREE.LineBasicMaterial({
      color: RISK_COLORS[obj.riskLevel],
      transparent: true,
      opacity: 0.6,
    })

    const line = new THREE.Line(traceGeo, traceMat)
    scene.add(line)
    orbitLineRef.current = line
  }, [selectedNoradId, debris])

  // Mouse drag to orbit camera
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    prevMouse.current = { x: e.clientX, y: e.clientY }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !cameraRef.current) return
    const dx = e.clientX - prevMouse.current.x
    const dy = e.clientY - prevMouse.current.y
    prevMouse.current = { x: e.clientX, y: e.clientY }
    cameraAngle.current.theta -= dx * 0.005
    cameraAngle.current.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, cameraAngle.current.phi - dy * 0.005)
    )
    const r = cameraRadius.current
    const { theta, phi } = cameraAngle.current
    cameraRef.current.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
    cameraRef.current.lookAt(0, 0, 0)
  }

  const onWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return
    cameraRadius.current = Math.max(1.5, Math.min(8, cameraRadius.current + e.deltaY * 0.005))
    const r = cameraRadius.current
    const { theta, phi } = cameraAngle.current
    cameraRef.current.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
    cameraRef.current.lookAt(0, 0, 0)
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={() => (isDragging.current = false)}
      onMouseLeave={() => (isDragging.current = false)}
      onWheel={onWheel}
    />
  )
}
