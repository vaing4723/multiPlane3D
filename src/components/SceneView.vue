<template>
  <div class="scene-view">
    <div class="view-header">{{ viewTitle }}</div>
    <div ref="containerRef" class="view-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed, onUnmounted, shallowRef } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { useSceneStore } from '../store/sceneStore';
import {
  updateVisibleEdges,
  highlightCrosshairPlanes,
  rotateCrosshairPlanes,
  updateCameraPosition
} from '../utils/sceneUtils';

const props = defineProps<{
  viewType: 'main' | 'front' | 'top' | 'side';
}>();

const { scene, cameraMeshes, initializeScene, updateCameraMeshPositions, setViewCamera } =
  useSceneStore();

const containerRef = ref<HTMLElement | null>(null);
const camera = ref<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
const renderer = ref<THREE.WebGLRenderer | null>(null);
const controls = ref<OrbitControls | null>(null);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let selectedPlane: THREE.Mesh | null = null;

const viewTitle = computed(() => {
  switch (props.viewType) {
    case 'main':
      return 'Main 3D View';
    case 'front':
      return 'Front View';
    case 'top':
      return 'Top View';
    case 'side':
      return 'Side View';
  }
});

onMounted(() => {
  initializeScene();

  if (!containerRef.value || !scene.value) return;

  const { width, height } = containerRef.value.getBoundingClientRect();

  if (props.viewType === 'main') {
    camera.value = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.value.position.set(10, 10, 10);
  } else {
    const aspect = width / height;
    const frustumSize = 10;
    camera.value = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    switch (props.viewType) {
      case 'front':
        camera.value.position.set(0, 10, 0);
        setViewCamera('front', camera.value);
        break;
      case 'top':
        camera.value.position.set(0, 0, 10);
        setViewCamera('top', camera.value);
        break;
      case 'side':
        camera.value.position.set(10, 0, 0);
        setViewCamera('side', camera.value);
        break;
    }
  }

  camera.value.up.set(0, 0, 1);
  camera.value.lookAt(0, 0, 0);

  renderer.value = new THREE.WebGLRenderer({ antialias: true });
  renderer.value.setSize(width, height);
  containerRef.value.appendChild(renderer.value.domElement);

  controls.value = new OrbitControls(camera.value, renderer.value.domElement);
  if (props.viewType !== 'main') {
    controls.value.enableRotate = false;
  }
  function onMouseMove(event: MouseEvent) {
    if (!containerRef.value || !scene.value || !camera.value || props.viewType === 'main') return;

    const rect = containerRef.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // updateVisibleEdges(scene.value, camera.value);
    highlightCrosshairPlanes(scene.value, camera.value);

    raycaster.setFromCamera(mouse, camera.value);
    const intersects = raycaster.intersectObjects(scene.value.children, true);

    if (intersects.length > 0 && intersects[0].object instanceof LineSegments2) {
      containerRef.value.style.cursor = 'crosshair';
    } else {
      containerRef.value.style.cursor = 'default';
    }

    if (isDragging && selectedPlane) {
      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;
      const rotationAngle = (movementX + movementY) * 0.01;
      rotateCrosshairPlanes(scene.value, camera.value, rotationAngle);
    }
  }

  function onMouseDown(event: MouseEvent) {
    if (!scene.value || !camera.value || props.viewType === 'main') return;

    raycaster.setFromCamera(mouse, camera.value);
    const intersects = raycaster.intersectObjects(scene.value.children, true);

    if (intersects.length > 0 && intersects[0].object instanceof LineSegments2) {
      isDragging = true;
      selectedPlane = intersects[0].object.parent as THREE.Mesh;
    }
  }

  function onMouseUp() {
    isDragging = false;
    selectedPlane = null;
  }

  // Add event listeners
  containerRef.value.addEventListener('mousemove', onMouseMove);
  containerRef.value.addEventListener('mousedown', onMouseDown);
  containerRef.value.addEventListener('mouseup', onMouseUp);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (controls.value) controls.value.update();
    if (renderer.value && scene.value && camera.value) {
      // updateVisibleEdges(scene.value, camera.value);
      highlightCrosshairPlanes(scene.value, camera.value);
      renderer.value.render(scene.value, camera.value);
    }
  }

  // Start animation loop
  animate();

  // Handle window resize
  function onWindowResize() {
    if (!containerRef.value || !camera.value || !renderer.value) return;

    const { width, height } = containerRef.value.getBoundingClientRect();

    if (camera.value instanceof THREE.PerspectiveCamera) {
      camera.value.aspect = width / height;
    } else if (camera.value instanceof THREE.OrthographicCamera) {
      const frustumSize = 10;
      const aspect = width / height;
      camera.value.left = (frustumSize * aspect) / -2;
      camera.value.right = (frustumSize * aspect) / 2;
      camera.value.top = frustumSize / 2;
      camera.value.bottom = frustumSize / -2;
    }

    camera.value.updateProjectionMatrix();
    renderer.value.setSize(width, height);
  }

  window.addEventListener('resize', onWindowResize);

  // Clean up function
  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('mousemove', onMouseMove);
      containerRef.value.removeEventListener('mousedown', onMouseDown);
      containerRef.value.removeEventListener('mouseup', onMouseUp);
    }
    window.removeEventListener('resize', onWindowResize);

    if (renderer.value && renderer.value.domElement && renderer.value.domElement.parentNode) {
      renderer.value.domElement.parentNode.removeChild(renderer.value.domElement);
    }

    renderer.value?.dispose();
    controls.value?.dispose();
  });
});
</script>

<style scoped>
.scene-view {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.view-header {
  background-color: #333;
  color: #fff;
  padding: 5px 10px;
  font-size: 14px;
  font-weight: bold;
}

.view-container {
  flex-grow: 1;
}
</style>
