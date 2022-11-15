<script setup lang="ts">
import { useQuickImportStoreOrThrow } from '#imports'

const { importStepper } = useQuickImportStoreOrThrow()!
</script>

<template>
  <a-steps v-model:current="importStepper" type="navigation">
    <a-step title="Upload Data" description="" />
    <a-step title="Review Data" description="" />
    <a-step title="Load To Database" description="" />
  </a-steps>
</template>
