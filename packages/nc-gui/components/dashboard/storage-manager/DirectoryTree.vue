<script setup lang="ts">
import { onMounted, useStorageManagerStoreOrThrow } from '#imports'
const { loadDirectoryTree, directoryTree, directoryTreeSelectedKeys, directoryTreeExpandedKeys } = useStorageManagerStoreOrThrow()

onMounted(() => loadDirectoryTree())
</script>

<template>
  <a-tree
    v-model:expandedKeys="directoryTreeExpandedKeys"
    v-model:selectedKeys="directoryTreeSelectedKeys"
    :tree-data="directoryTree"
  >
    <template #title="{ title }">
      <span>{{ title }}</span>
    </template>
  </a-tree>
</template>
