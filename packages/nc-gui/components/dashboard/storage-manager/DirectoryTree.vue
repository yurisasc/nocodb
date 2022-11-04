<script setup lang="ts">
import { useStorageManagerStoreOrThrow } from '#imports'
const { directoryTree, directoryTreeSelectedKeys, directoryTreeExpandedKeys } = useStorageManagerStoreOrThrow()
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
