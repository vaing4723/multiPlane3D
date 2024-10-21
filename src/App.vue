<template>
  <div class="app-container">
    <div class="main-view">
      <SceneView :viewType="'main'" />
    </div>
    <div class="orthographic-views">
      <SceneView :viewType="'front'" />
      <SceneView :viewType="'top'" />
      <SceneView :viewType="'side'" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import SceneView from './components/SceneView.vue';
import { useSceneStore } from './store/sceneStore';

const { initializeScene } = useSceneStore();
initializeScene(); // Initialize the shared scene when the app starts
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: Arial, sans-serif;
}

.app-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 100vh;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
  background-color: #f0f0f0;
}

.main-view {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.orthographic-views {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  display: grid;
  grid-template-rows: repeat(3, 1fr);
  gap: 10px;
}
</style>
