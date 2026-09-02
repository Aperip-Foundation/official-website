import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type RefObject,
  type ReactNode,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { experienceStore } from './experienceStore'
import { configureOrthographicCamera } from './modelStageState'
import {
  PRESENTATION_ROTATION,
  sampleModelPose,
} from './sampleModelPose'
import {
  sampleModelTarget,
  type ModelTargetRect,
} from './lockupLayout'
import {
  LoadingWordmark,
  type LoadingWordmarkState,
} from './LoadingWordmark'

const MODEL_URL = '/assets/aperip-logo.glb'
const PRECISE_BOUNDS_ROTATION_STEP = 0.04
const FIXED_ROTATION_EPSILON = 0.000001
const LOADER_COMPLETE_HOLD_MS = 180
const LOADER_FADE_MS = 520

// Shared with ignored scene-contract tests; this file owns the renderer setup.
// eslint-disable-next-line react-refresh/only-export-components
export const SCENE_PRESENTATION = {
  interior: {
    radius: 18,
    color: '#010205',
    roughness: 0.98,
    widthSegments: 48,
    heightSegments: 32,
    receiveShadow: true,
  },
  shadows: {
    enabled: true,
    type: 'soft',
    rendererType: 'variance',
    mapSize: 1024,
    modelCastsShadow: true,
    modelReceivesShadow: true,
    keyLightCastsShadow: true,
    fillLightCastsShadow: false,
    cameraExtent: 5.5,
    cameraFar: 40,
    bias: -0.0003,
    normalBias: 0.025,
  },
} as const

export interface ModelStageProps {
  reducedMotion: boolean
  modelAnchorRef: RefObject<HTMLDivElement | null>
  loadingLabel: string
  failureLabel: string
  onModelAspectChange?: (aspect: number) => void
  onReady?: () => void
  onFailure?: (error: unknown) => void
}

interface ModelErrorBoundaryProps {
  children: ReactNode
  onError: (error: unknown) => void
}

interface ModelErrorBoundaryState {
  hasError: boolean
}

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  public state: ModelErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true }
  }

  public componentDidCatch(error: unknown): void {
    this.props.onError(error)
  }

  public render(): ReactNode {
    return this.state.hasError ? null : this.props.children
  }
}

function CameraRig(): null {
  const { camera, size } = useThree()

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return

    configureOrthographicCamera(camera, {
      width: size.width,
      height: size.height,
    })
  }, [camera, size.height, size.width])

  return null
}

interface PreparedModel {
  object: THREE.Object3D
  aspect: number
  presentationBounds: THREE.Box3
}

interface ModelSceneProps {
  reducedMotion: boolean
  modelAnchorRef: RefObject<HTMLDivElement | null>
  onModelAspectChange?: (aspect: number) => void
  onReady: () => void
  onFailure: (error: unknown) => void
}

function ModelScene({
  reducedMotion,
  modelAnchorRef,
  onModelAspectChange,
  onReady,
  onFailure,
}: ModelSceneProps): JSX.Element {
  const { scene } = useGLTF(MODEL_URL)
  const { invalidate, gl } = useThree()
  const modelRef = useRef<THREE.Group>(null)
  const readyRef = useRef(false)
  const visibleRef = useRef(true)
  const boundsRef = useRef(new THREE.Box3())
  const boundsCenterRef = useRef(new THREE.Vector3())
  const boundsSizeRef = useRef(new THREE.Vector3())
  const boundsObjectRef = useRef<THREE.Object3D | null>(null)
  const measuredRotationYRef = useRef(PRESENTATION_ROTATION[1])

  const prepared = useMemo<PreparedModel>(() => {
    const object = scene.clone(true)
    const bounds = new THREE.Box3().setFromObject(object, true)
    const center = bounds.getCenter(new THREE.Vector3())

    object.position.sub(center)
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = SCENE_PRESENTATION.shadows.modelCastsShadow
        child.receiveShadow = SCENE_PRESENTATION.shadows.modelReceivesShadow
        child.frustumCulled = true
      }
    })

    const presentationGroup = new THREE.Group()
    presentationGroup.rotation.set(...PRESENTATION_ROTATION)
    presentationGroup.add(object)
    presentationGroup.updateWorldMatrix(true, true)

    const presentationBounds = new THREE.Box3()
      .setFromObject(presentationGroup, true)
    const presentationSize = presentationBounds.getSize(new THREE.Vector3())
    const aspect = presentationSize.y > 0
      ? presentationSize.x / presentationSize.y
      : 1

    presentationGroup.remove(object)

    return {
      object,
      aspect: Number.isFinite(aspect) && aspect > 0 ? aspect : 1,
      presentationBounds,
    }
  }, [scene])

  useEffect(() => {
    onModelAspectChange?.(prepared.aspect)
  }, [onModelAspectChange, prepared.aspect])

  useEffect(() => {
    const canvas = gl.domElement
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      onFailure(new Error('WebGL context lost'))
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)

    return () => canvas.removeEventListener('webglcontextlost', handleContextLost)
  }, [gl, onFailure])

  useEffect(() => {
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible'
      invalidate()
    }

    visibleRef.current = document.visibilityState === 'visible'
    document.addEventListener('visibilitychange', handleVisibility)

    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [invalidate])

  useFrame(({ camera, clock }) => {
    const model = modelRef.current
    if (!model || !(camera instanceof THREE.OrthographicCamera)) return

    const idleRadians = reducedMotion || !visibleRef.current
      ? 0
      : clock.getElapsedTime() * 0.18
    const progress = experienceStore.getProgress()
    const pose = sampleModelPose(progress, idleRadians)
    const canvasRect = gl.domElement.getBoundingClientRect()

    if (canvasRect.width <= 0 || canvasRect.height <= 0) return

    const anchorBounds = modelAnchorRef.current?.getBoundingClientRect()
    const anchorRect: ModelTargetRect = anchorBounds
      ? {
          centerX: anchorBounds.left - canvasRect.left + anchorBounds.width / 2,
          centerY: anchorBounds.top - canvasRect.top + anchorBounds.height / 2,
          width: anchorBounds.width,
          height: anchorBounds.height,
        }
      : {
          centerX: canvasRect.width / 2,
          centerY: canvasRect.height / 2,
          width: 0,
          height: 0,
        }
    const target = sampleModelTarget(
      progress,
      { width: canvasRect.width, height: canvasRect.height },
      anchorRect,
      prepared.aspect,
    )

    model.rotation.set(pose.rotation[0], pose.rotation[1], pose.rotation[2])
    model.position.set(0, 0, 0)
    model.scale.setScalar(1)
    model.visible = pose.opacity > 0
    model.updateWorldMatrix(true, true)

    const bounds = boundsRef.current
    if (boundsObjectRef.current !== prepared.object) {
      bounds.copy(prepared.presentationBounds)
      boundsObjectRef.current = prepared.object
      measuredRotationYRef.current = PRESENTATION_ROTATION[1]
    }

    const fixedPresentationRotation = Math.abs(
      pose.rotation[1] - PRESENTATION_ROTATION[1],
    ) <= FIXED_ROTATION_EPSILON
    if (fixedPresentationRotation) {
      if (measuredRotationYRef.current !== PRESENTATION_ROTATION[1]) {
        bounds.copy(prepared.presentationBounds)
        measuredRotationYRef.current = PRESENTATION_ROTATION[1]
      }
    } else if (Math.abs(
      pose.rotation[1] - measuredRotationYRef.current,
    ) >= PRECISE_BOUNDS_ROTATION_STEP) {
      bounds.setFromObject(model, true)
      measuredRotationYRef.current = pose.rotation[1]
    }

    if (bounds.isEmpty()) return

    const boundsSize = bounds.getSize(boundsSizeRef.current)
    if (boundsSize.x <= 0 || boundsSize.y <= 0) return

    const zoom = camera.zoom > 0 ? camera.zoom : 1
    const visibleWorldWidth = (camera.right - camera.left) / zoom
    const visibleWorldHeight = (camera.top - camera.bottom) / zoom
    const targetWorldWidth = (target.width / canvasRect.width) * visibleWorldWidth
    const targetWorldHeight = (target.height / canvasRect.height) * visibleWorldHeight
    const fitScale = Math.min(
      targetWorldWidth / boundsSize.x,
      targetWorldHeight / boundsSize.y,
    )

    if (!Number.isFinite(fitScale) || fitScale <= 0) return

    const boundsCenter = bounds.getCenter(boundsCenterRef.current)
    const targetWorldX = (
      (target.centerX - canvasRect.width / 2)
      / canvasRect.width
    ) * visibleWorldWidth
    const targetWorldY = -(
      (target.centerY - canvasRect.height / 2)
      / canvasRect.height
    ) * visibleWorldHeight

    model.scale.setScalar(fitScale)
    model.position.set(
      targetWorldX - boundsCenter.x * fitScale,
      targetWorldY - boundsCenter.y * fitScale,
      -boundsCenter.z * fitScale,
    )

    if (!readyRef.current && model.visible && gl.info.render.calls > 0) {
      readyRef.current = true
      onReady()
    }
  })

  return (
    <>
      <CameraRig />
      <mesh
        receiveShadow={SCENE_PRESENTATION.interior.receiveShadow}
        castShadow={false}
      >
        <sphereGeometry
          args={[
            SCENE_PRESENTATION.interior.radius,
            SCENE_PRESENTATION.interior.widthSegments,
            SCENE_PRESENTATION.interior.heightSegments,
          ]}
        />
        <meshStandardMaterial
          color={SCENE_PRESENTATION.interior.color}
          side={THREE.BackSide}
          roughness={SCENE_PRESENTATION.interior.roughness}
          metalness={0}
        />
      </mesh>
      <ambientLight intensity={0.13} color="#aebed4" />
      <hemisphereLight args={['#b7d8fa', '#010205', 0.2]} />
      <directionalLight
        position={[-3.4, 4.6, 5]}
        intensity={2.5}
        color="#7dc8ff"
        castShadow={SCENE_PRESENTATION.shadows.keyLightCastsShadow}
        shadow-mapSize-width={SCENE_PRESENTATION.shadows.mapSize}
        shadow-mapSize-height={SCENE_PRESENTATION.shadows.mapSize}
        shadow-camera-near={0.1}
        shadow-camera-far={SCENE_PRESENTATION.shadows.cameraFar}
        shadow-camera-left={-SCENE_PRESENTATION.shadows.cameraExtent}
        shadow-camera-right={SCENE_PRESENTATION.shadows.cameraExtent}
        shadow-camera-top={SCENE_PRESENTATION.shadows.cameraExtent}
        shadow-camera-bottom={-SCENE_PRESENTATION.shadows.cameraExtent}
        shadow-bias={SCENE_PRESENTATION.shadows.bias}
        shadow-normalBias={SCENE_PRESENTATION.shadows.normalBias}
      />
      <directionalLight
        position={[3.1, 4.2, 4.2]}
        intensity={2.05}
        color="#ff9fc8"
        castShadow={SCENE_PRESENTATION.shadows.fillLightCastsShadow}
      />
      <group ref={modelRef}>
        <primitive object={prepared.object} />
      </group>
    </>
  )
}

export function ModelStage({
  reducedMotion,
  modelAnchorRef,
  loadingLabel,
  failureLabel,
  onModelAspectChange,
  onReady,
  onFailure,
}: ModelStageProps): JSX.Element {
  const [state, setState] = useState<LoadingWordmarkState>('loading')
  const [revealed, setRevealed] = useState(false)
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const completionScheduledRef = useRef(false)
  const revealTimersRef = useRef<number[]>([])

  const clearRevealTimers = useCallback(() => {
    revealTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    revealTimersRef.current = []
  }, [])

  const queueReveal = useCallback((
    completionState: Extract<LoadingWordmarkState, 'complete' | 'failed'>,
    notify: () => void,
  ) => {
    clearRevealTimers()
    setState(completionState)

    const fadeTimer = window.setTimeout(() => {
      setState('ready')

      const revealTimer = window.setTimeout(() => {
        setRevealed(true)
        notify()
      }, LOADER_FADE_MS)
      revealTimersRef.current.push(revealTimer)
    }, LOADER_COMPLETE_HOLD_MS)
    revealTimersRef.current.push(fadeTimer)
  }, [clearRevealTimers])

  useEffect(() => clearRevealTimers, [clearRevealTimers])

  const handleReady = useCallback(() => {
    if (completionScheduledRef.current) return

    completionScheduledRef.current = true
    queueReveal('complete', () => onReady?.())
  }, [onReady, queueReveal])

  const handleFailure = useCallback((error: unknown) => {
    if (completionScheduledRef.current) return

    completionScheduledRef.current = true
    setFailureReason(error instanceof Error ? error.message : String(error))
    queueReveal('failed', () => onFailure?.(error))
  }, [onFailure, queueReveal])

  return (
    <div
      className="model-stage"
      data-model-state={state}
      data-model-revealed={revealed}
      data-model-error={failureReason ?? undefined}
    >
      <ModelErrorBoundary onError={handleFailure}>
        <Canvas
          className="model-stage__canvas"
          orthographic
          dpr={[1, 1.5]}
          frameloop="always"
          shadows={SCENE_PRESENTATION.shadows.rendererType}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0, 5], near: 0.1, far: 100 }}
          onCreated={({ gl: renderer }) => {
            renderer.setClearColor(0x000000, 0)
            renderer.toneMappingExposure = 1.14
          }}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <ModelScene
              reducedMotion={reducedMotion}
              modelAnchorRef={modelAnchorRef}
              onModelAspectChange={onModelAspectChange}
              onReady={handleReady}
              onFailure={handleFailure}
            />
          </Suspense>
        </Canvas>
      </ModelErrorBoundary>
      <LoadingWordmark
        loadingLabel={loadingLabel}
        failureLabel={failureLabel}
        state={state}
      />
    </div>
  )
}
