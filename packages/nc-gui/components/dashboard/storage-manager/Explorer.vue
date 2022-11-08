<script setup lang="ts">
import { isImage, useStorageManagerStoreOrThrow, watch } from '#imports'
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
    <div class="nc-storage-toolbar w-full py-1 flex gap-2 items-center h-[var(--toolbar-height)] px-2 border-b overflow-x-hidden">
      <LazyDashboardStorageManagerBreadcrumb />

      <div class="flex-1" />

      <LazyDashboardStorageManagerSearch />
    </div>

    <LazyDashboardStorageManagerToolbar />

    <div class="flex flex-row select-none text-center cursor-pointer gap-4">
      <!-- Folders -->
      <a-card
        v-for="(folder, idx) of folders"
        :key="idx"
        hoverable
        class="w-[150px]"
        :body-style="{ padding: '20px 5px' }"
        @dblclick="updateSelectedKeys(folder.key)"
      >
        <template #cover>
          <div class="pt-[15px]">
            <MdiFolderOpenOutline class="text-4xl" />
          </div>
        </template>
        <a-card-meta>
          <template #title>
            <span class="text-sm">{{ folder.title }}</span>
          </template>
        </a-card-meta>
      </a-card>

      <!-- Files -->
      <a-card v-for="(file, idx) of storages" :key="idx" hoverable class="w-[150px]" :body-style="{ padding: '20px 5px' }">
        <template #cover>
          <div class="nc-storage flex items-center justify-center">
            <LazyNuxtImg
              v-if="isImage(file.title, file.mimetype) && file.url"
              quality="75"
              placeholder
              fit="cover"
              :src="file.url"
              class="max-w-full max-h-full p-[20px]"
            />
            <MdiFileDocumentOutline v-else class="text-4xl" />
          </div>
        </template>
        <a-card-meta>
          <template #title>
            <span class="text-sm">{{ file.title }}</span>
          </template>
        </a-card-meta>
      </a-card>
    </div>
  </div>
</template>
