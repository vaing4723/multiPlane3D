import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { useSceneStore } from '@/store/sceneStore';

export function createPlaneWithEdges(size: number, color: number): THREE.Mesh {
  const planeGeometry = new THREE.PlaneGeometry(size, size);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);

  const edgesGeometry = new LineSegmentsGeometry().setPositions([
    -size / 2,
    -size / 2,
    0,
    size / 2,
    -size / 2,
    0,
    size / 2,
    -size / 2,
    0,
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    0,
    -size / 2,
    size / 2,
    0,
    -size / 2,
    size / 2,
    0,
    -size / 2,
    -size / 2,
    0
  ]);

  const edgesMaterial = new LineMaterial({
    color: color,
    linewidth: 5,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight)
  });

  const edges = new LineSegments2(edgesGeometry, edgesMaterial);

  // 将边缘作为平面的子对象
  plane.add(edges);

  return plane;
}

export function updateVisibleEdges(scene: THREE.Scene, camera: THREE.Camera) {
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.children[0] instanceof LineSegments2) {
      const planeNormal = new THREE.Vector3();
      object.getWorldDirection(planeNormal);

      // Edge is visible if plane is parallel to camera direction
      const isVisible = Math.abs(cameraDirection.dot(planeNormal)) > 0.99;
      object.children[0].visible = isVisible;
    }
  });
}

export function highlightCrosshairPlanes(scene: THREE.Scene, camera: THREE.Camera) {
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const planeNormal = new THREE.Vector3();
      object.getWorldDirection(planeNormal);

      const isHighlighted = Math.abs(cameraDirection.dot(planeNormal)) < 0.01;

      // 假设边缘是平面的第一个子对象
      const edges = object.children[0] as LineSegments2;
      if (edges instanceof LineSegments2) {
        if (isHighlighted) {
          // (edges.material as LineMaterial).color.setHex(0xff0000);
          (edges.material as LineMaterial).linewidth = 10;
        } else {
          // (edges.material as LineMaterial).color.setHex(0x000000);
          (edges.material as LineMaterial).linewidth = 5;
        }
        (edges.material as LineMaterial).needsUpdate = true;
      }
    }
  });
}

export function rotateCrosshairPlanes(
  scene: THREE.Scene,
  currentCamera: THREE.Camera,
  angle: number
) {
  const { frontCamera, topCamera, sideCamera } = useSceneStore();

  const rotationAxis = new THREE.Vector3();
  currentCamera.getWorldDirection(rotationAxis);

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const planeNormal = new THREE.Vector3();
      object.getWorldDirection(planeNormal);

      // 如果平面垂直于当前相机方向，旋转该平面
      if (Math.abs(rotationAxis.dot(planeNormal)) < 0.01) {
        object.rotateOnAxis(rotationAxis, angle);
      }
    }
  });

  const camerasToRotate: THREE.Camera[] = [];
  // 确定要旋转的相机
  if (currentCamera === frontCamera.value) {
    camerasToRotate.push(topCamera.value!, sideCamera.value!);
  } else if (currentCamera === topCamera.value) {
    camerasToRotate.push(frontCamera.value!, sideCamera.value!);
  } else if (currentCamera === sideCamera.value) {
    camerasToRotate.push(frontCamera.value!, topCamera.value!);
  }

  // 旋转相机
  camerasToRotate.forEach((camera) => {
    const distance = camera.position.length();
    camera.position.applyAxisAngle(rotationAxis, angle);
    camera.position.setLength(distance); // 保持距离不变
    camera.lookAt(scene.position);
  });

  // 更新相机 mesh 的位置
  useSceneStore().updateCameraMeshPositions();
}

function updateOtherViewCameras(
  scene: THREE.Scene,
  currentCamera: THREE.Camera,
  angle: number,
  axis: THREE.Vector3
) {
  scene.traverse((object) => {
    if (object instanceof THREE.Camera && object !== currentCamera) {
      const distance = object.position.length();
      object.position.applyAxisAngle(axis, angle);
      object.position.setLength(distance);
      object.lookAt(scene.position);
    }
  });
}
