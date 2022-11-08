<script setup lang="ts">
import { useStorageManagerStoreOrThrow, watch } from '#imports'
const { storages, directoryTree, breadcrumbItems, loadStorageByDirectory, updateSelectedKeys } = useStorageManagerStoreOrThrow()

watch(breadcrumbItems, async (v: Record<string, any>) => {
  await loadStorageByDirectory(v?.at(-1)?.key.split('/').slice(1).join('/'))
})

const currentDirectory = computed(() => breadcrumbItems.value?.at(-1)?.key)

// TODO(storage): types
function dfs(treeNode: any): any {
  if (!treeNode) return []
  if (treeNode.key === currentDirectory.value) return treeNode.children
  if (treeNode.children) {
    for (const node of treeNode.children) {
      const matchedTreeNode = dfs(node)
      if (matchedTreeNode.length) {
        return matchedTreeNode
      }
    }
  }
  return []
}

// TODO: retrive source idx
// 0: Local
const folders = computed(() => dfs(directoryTree.value[0]))
</script>

<template>
  <div v-show="currentDirectory">
    <div
        class="nc-storage-toolbar w-full py-1 flex gap-2 items-center h-[var(--toolbar-height)] px-2 border-b overflow-x-hidden"
        style="z-index: 7"
    >
      <LazyDashboardStorageManagerBreadcrumb />

      <div class="flex-1" />

      <LazyDashboardStorageManagerSearch />
    </div>

    <LazyDashboardStorageManagerToolbar />

    <div class="flex flex-row">
      <div
          v-for="(folder, idx) of folders"
          :key="idx"
          class="w-60px align-center cursor-pointer"
          @click="updateSelectedKeys(folder.key)"
      >
        <MdiFolderOpenOutline class="text-4xl" />
        <div class="align-center">{{ folder.title }}</div>
      </div>
      <div v-for="(file, idx) of storages" :key="idx" class="w-60px align-center cursor-pointer">
        <MdiFileDocumentOutline class="text-4xl" />
        <div class="align-center">{{ file.title }}</div>
      </div>
    </div>
  </div>
</template>
