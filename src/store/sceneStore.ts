import { ref, shallowRef } from 'vue';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { createPlaneWithEdges } from '@/utils/sceneUtils';

const scene = shallowRef<THREE.Scene | null>(null);
const cameraMeshes = ref<THREE.Mesh[]>([]);
const frontCamera = ref<THREE.Camera | null>(null);
const topCamera = ref<THREE.Camera | null>(null);
const sideCamera = ref<THREE.Camera | null>(null);

export function useSceneStore() {
  function initializeScene() {
    if (!scene.value) {
      scene.value = new THREE.Scene();
      scene.value.background = new THREE.Color(0xf0f0f0);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      const pointLight = new THREE.PointLight(0xffffff, 0.5);
      pointLight.position.set(5, 5, 5);
      scene.value.add(ambientLight, pointLight);

      // Create planes with visible edges
      const planeXY = createPlaneWithEdges(10, 0xff0000);
      const planeYZ = createPlaneWithEdges(10, 0x0000ff);
      const planeXZ = createPlaneWithEdges(10, 0x00ff00);

      planeYZ.rotateY(Math.PI / 2);
      planeXZ.rotateX(Math.PI / 2);

      scene.value.add(planeXY, planeYZ, planeXZ);

      // Create camera meshes
      const cameraGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const cameraMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
        new THREE.MeshBasicMaterial({ color: 0x0000ff }),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      ];

      cameraMeshes.value = cameraMaterials.map((material) => {
        const mesh = new THREE.Mesh(cameraGeometry, material);
        scene.value!.add(mesh);
        return mesh;
      });

      updateCameraMeshPositions();
    }
  }

  function setViewCamera(viewType: 'front' | 'top' | 'side', camera: THREE.Camera) {
    switch (viewType) {
      case 'front':
        frontCamera.value = camera;
        break;
      case 'top':
        topCamera.value = camera;
        break;
      case 'side':
        sideCamera.value = camera;
        break;
    }
  }

  function getFrontViewCameraPosition(): THREE.Vector3 {
    return frontCamera.value ? frontCamera.value.position : new THREE.Vector3(0, 10, 0);
  }

  function getTopViewCameraPosition(): THREE.Vector3 {
    return topCamera.value ? topCamera.value.position : new THREE.Vector3(0, 0, 10);
  }

  function getSideViewCameraPosition(): THREE.Vector3 {
    return sideCamera.value ? sideCamera.value.position : new THREE.Vector3(10, 0, 0);
  }

  function updateCameraMeshPositions() {
    if (cameraMeshes.value.length === 3) {
      cameraMeshes.value[0].position.copy(getTopViewCameraPosition());
      cameraMeshes.value[1].position.copy(getSideViewCameraPosition());
      cameraMeshes.value[2].position.copy(getFrontViewCameraPosition());
    }
  }

  return {
    scene,
    cameraMeshes,
    frontCamera,
    topCamera,
    sideCamera,
    initializeScene,
    setViewCamera,
    getFrontViewCameraPosition,
    getTopViewCameraPosition,
    getSideViewCameraPosition,
    updateCameraMeshPositions
  };
}
