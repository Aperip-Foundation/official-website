import type { OrthographicCamera } from 'three'

export const CAMERA_HEIGHT = 4

export interface SceneViewport {
  width: number
  height: number
}

export function cssPoseToScene(
  position: [number, number, number],
  viewport: SceneViewport,
): [number, number, number] {
  if (viewport.width <= 0 || viewport.height <= 0) return [0, 0, position[2]]

  const worldWidth = CAMERA_HEIGHT * (viewport.width / viewport.height)
  return [
    (position[0] / viewport.width) * worldWidth,
    (position[1] / viewport.height) * CAMERA_HEIGHT,
    position[2],
  ]
}

export function configureOrthographicCamera(
  camera: OrthographicCamera,
  viewport: SceneViewport,
): void {
  const aspect = viewport.height > 0 ? viewport.width / viewport.height : 1
  const halfHeight = CAMERA_HEIGHT / 2
  const halfWidth = halfHeight * aspect

  camera.left = -halfWidth
  camera.right = halfWidth
  camera.top = halfHeight
  camera.bottom = -halfHeight
  camera.near = 0.1
  camera.far = 100
  camera.position.set(0, 0, 5)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}
