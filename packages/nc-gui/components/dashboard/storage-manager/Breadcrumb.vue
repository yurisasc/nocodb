<script setup lang="ts">
import { useStorageManagerStoreOrThrow } from '#imports'
const { breadcrumbItems } = useStorageManagerStoreOrThrow()
</script>

<template>
  <a-breadcrumb>
    <!-- TODO: make each item clickable to navigate -->
    <a-breadcrumb-item v-for="(breadcrumbItem, idx) of breadcrumbItems" :key="idx">{{ breadcrumbItem }}</a-breadcrumb-item>
  </a-breadcrumb>
</template>
