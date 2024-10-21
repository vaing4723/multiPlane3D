<template>
  <div class="orthographic-view">
    <div class="view-header">{{ viewName }}</div>
    <div ref="containerRef" class="view-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { createScene, createPlanes, highlightEdge, rotateEdge } from '../utils/sceneUtils';

const props = defineProps<{
  cameraPosition: [number, number, number];
  planeNormal: [number, number, number];
  planeColor: string;
  viewName: string;
}>();

const containerRef = ref<HTMLElement | null>(null);
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let planes: THREE.Mesh[];
let edges: Line2[];

onMounted(() => {
  if (!containerRef.value) return;

  const { width, height } = containerRef.value.getBoundingClientRect();

  scene = createScene();
  camera = new THREE.OrthographicCamera(
    width / -200,
    width / 200,
    height / 200,
    height / -200,
    0.1,
    1000
  );
  camera.position.set(...props.cameraPosition);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  containerRef.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false;

  const { planes: createdPlanes, edges: createdEdges } = createPlanes();
  planes = createdPlanes;
  edges = createdEdges;
  scene.add(...planes, ...edges);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  containerRef.value.addEventListener('mousemove', onMouseMove);
  containerRef.value.addEventListener('mousedown', onMouseDown);
  containerRef.value.addEventListener('mouseup', onMouseUp);

  function onMouseMove(event: MouseEvent) {
    mouse.x = (event.clientX / width) * 2 - 1;
    mouse.y = -(event.clientY / height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(edges);
    edges.forEach((edge) => (edge.material as LineMaterial).color.setHex(0xffffff));
    if (intersects.length > 0) {
      highlightEdge(intersects[0].object as Line2);
    }
  }

  let isDragging = false;
  let selectedEdge: Line2 | null = null;
  let previousMousePosition = new THREE.Vector2();

  function onMouseDown(event: MouseEvent) {
    mouse.x = (event.clientX / width) * 2 - 1;
    mouse.y = -(event.clientY / height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(edges);
    if (intersects.length > 0) {
      isDragging = true;
      selectedEdge = intersects[0].object as Line2;
      previousMousePosition.set(event.clientX, event.clientY);
    }
  }

  function onMouseUp() {
    isDragging = false;
    selectedEdge = null;
  }

  function animate() {
    requestAnimationFrame(animate);
    if (isDragging && selectedEdge) {
      const currentMousePosition = new THREE.Vector2(event?.clientX || 0, event?.clientY || 0);
      const deltaMove = currentMousePosition.sub(previousMousePosition);
      const rotationAngle = deltaMove.x * 0.01;
      rotateEdge(selectedEdge, rotationAngle, new THREE.Vector3(...props.planeNormal));
      previousMousePosition.set(event?.clientX || 0, event?.clientY || 0);
    }
    renderer.render(scene, camera);
  }

  animate();
});

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('mousemove', onMouseMove);
    containerRef.value.removeEventListener('mousedown', onMouseDown);
    containerRef.value.removeEventListener('mouseup', onMouseUp);
  }
});
</script>

<style scoped>
.orthographic-view {
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
