<script setup lang="ts">
import { useStorageManagerStoreOrThrow, watch } from '#imports'
const { breadcrumbItems, loadStorageByDirectory } = useStorageManagerStoreOrThrow()

watch(breadcrumbItems, async (v: Record<string, any>) => {
  await loadStorageByDirectory(v?.at(-1)?.key.split("/").slice(1).join('/'))
})
</script>

<template>
  <LazyDashboardStorageManagerBreadcrumb />
  <h1 class="prose-2xl font-bold mt-2">
    {{ breadcrumbItems?.at(-1)?.key }}
  </h1>
</template>
