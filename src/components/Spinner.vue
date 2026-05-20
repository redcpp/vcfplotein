<template>
  <div class="flex w-full items-center justify-center">
    <div class="fulfilling-bouncing-circle-spinner">
      <div class="circle"></div>
      <div class="orbit"></div>
    </div>
  </div>
</template>

<script setup>
// Ported from components/Spinner.vue.
// The epic-spinners animation lived in assets/scss/_spinner.scss; it is inlined
// here (unscoped) so the component is self-contained in the Vue 3 build.
</script>

<style>
/* epic-spinners "fulfilling-bouncing-circle" — ported from _spinner.scss. */
.fulfilling-bouncing-circle-spinner,
.fulfilling-bouncing-circle-spinner * {
  box-sizing: border-box;
}
.fulfilling-bouncing-circle-spinner {
  height: 120px;
  width: 120px;
  position: relative;
  animation: fulfilling-bouncing-circle-spinner-animation infinite 4000ms ease;
}
.fulfilling-bouncing-circle-spinner .orbit {
  height: 120px;
  width: 120px;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  border: calc(120px * 0.03) solid #3a5bd9;
  animation: fulfilling-bouncing-circle-spinner-orbit-animation infinite 4000ms ease;
}
.fulfilling-bouncing-circle-spinner .circle {
  height: 120px;
  width: 120px;
  color: #3a5bd9;
  display: block;
  border-radius: 50%;
  position: relative;
  border: calc(120px * 0.1) solid #3a5bd9;
  animation: fulfilling-bouncing-circle-spinner-circle-animation infinite 4000ms ease;
  transform: rotate(0deg) scale(1);
}
@keyframes fulfilling-bouncing-circle-spinner-animation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes fulfilling-bouncing-circle-spinner-orbit-animation {
  0% { transform: scale(1); }
  50% { transform: scale(1); }
  62.5% { transform: scale(0.8); }
  75% { transform: scale(1); }
  87.5% { transform: scale(0.8); }
  100% { transform: scale(1); }
}
@keyframes fulfilling-bouncing-circle-spinner-circle-animation {
  0% {
    transform: scale(1);
    border-color: transparent;
    border-top-color: inherit;
  }
  16.7% {
    border-color: transparent;
    border-top-color: initial;
    border-right-color: initial;
  }
  33.4% {
    border-color: transparent;
    border-top-color: inherit;
    border-right-color: inherit;
    border-bottom-color: inherit;
  }
  50% {
    border-color: inherit;
    transform: scale(1);
  }
  62.5% {
    border-color: inherit;
    transform: scale(1.4);
  }
  75% {
    border-color: inherit;
    transform: scale(1);
    opacity: 1;
  }
  87.5% {
    border-color: inherit;
    transform: scale(1.4);
  }
  100% {
    border-color: transparent;
    border-top-color: inherit;
    transform: scale(1);
  }
}
</style>
