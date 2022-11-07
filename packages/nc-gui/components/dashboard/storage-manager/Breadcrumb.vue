<script setup lang="ts">
import { useStorageManagerStoreOrThrow } from '#imports'
const { breadcrumbItems, updateSelectedKeys } = useStorageManagerStoreOrThrow()
</script>

<template>
  <a-breadcrumb>
    <a-breadcrumb-item
      v-for="(breadcrumbItem, idx) of breadcrumbItems"
      :key="idx"
      class="cursor-pointer"
      @click="updateSelectedKeys(breadcrumbItem.key)"
    >
      {{ breadcrumbItem.title }}
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>
