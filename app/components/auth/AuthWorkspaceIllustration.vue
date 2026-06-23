<script setup lang="ts">
const imageSrc = '/images/screen.png'
</script>

<template>
  <div class="workspace-canvas select-none">
    <img
      :src="imageSrc"
      alt="Planify AI dashboard preview"
      class="workspace-image"
    >
  </div>
</template>

<style scoped>
.workspace-canvas {
  position: relative;
  width: 100%;
  max-width: none;
  width: min(100%, 980px);
  height: 360px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.workspace-image {
  width: 145%;
  height: auto;
  max-width: none;
  object-fit: contain;
  object-position: center;
  display: block;
  transform: translateX(28px) scaleY(0.88);
  transform-origin: center;
}

@media (max-width: 1280px) {
  .workspace-canvas {
    width: min(100%, 900px);
    height: 330px;
  }

  .workspace-image {
    width: 150%;
    transform: translateX(20px) scaleY(0.88);
  }
}

@media (max-width: 1024px) {
  .workspace-canvas {
    width: min(100%, 760px);
    height: 300px;
  }

  .workspace-image {
    width: 155%;
    transform: translateX(14px) scaleY(0.88);
  }
}
</style>
