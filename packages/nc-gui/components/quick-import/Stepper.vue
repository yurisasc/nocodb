<script setup lang="ts">
const current = ref<number>(0)
</script>

<template>
  <a-steps v-model:current="current" type="navigation">
    <a-step title="Upload Data" description="" />
    <a-step title="Review Data" description="" />
    <a-step title="Load To Database" description="" />
  </a-steps>
</template>
