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
      <div class="flex items-center">
        <MdiFolderOutline class="text-gray-500 mr-2" />
        {{ title }}
      </div>
    </template>
  </a-tree>
</template>
