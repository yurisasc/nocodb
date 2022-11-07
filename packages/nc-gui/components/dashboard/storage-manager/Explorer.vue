<script setup lang="ts">
import { useStorageManagerStoreOrThrow } from '#imports'
const { breadcrumbItems } = useStorageManagerStoreOrThrow()
</script>

<template>
  <LazyDashboardStorageManagerBreadcrumb />
  <h1 class="prose-2xl font-bold mt-2">
    {{ breadcrumbItems?.at(-1)?.title }}
  </h1>
</template>
