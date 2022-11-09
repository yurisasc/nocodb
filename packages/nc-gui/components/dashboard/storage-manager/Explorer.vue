<script setup lang="ts">
import type { TreeProps } from 'ant-design-vue'
import type { StorageType } from 'nocodb-sdk'
import { isImage, onClickOutside, useStorageManagerStoreOrThrow, watch } from '#imports'
const {
  storages,
  directoryTree,
  breadcrumbItems,
  loadStorageByDirectory,
  updateSelectedKeys,
  selectedStorageObjects,
  selectedSidebarObject,
} = useStorageManagerStoreOrThrow()

const currentDirectory = computed(() => breadcrumbItems.value?.at(-1)?.key)

const storageObjRef = ref(null)

// TODO: retrive source idx
// 0: Local
const folders = computed(() => dfs(directoryTree.value[0]))

function dfs(treeNode: TreeProps['treeData']): TreeProps['treeData'] {
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

function handleFolderClick(folderKey: string, folderObj: TreeProps['treeData']) {
  selectedStorageObjects.value[folderKey] = folderObj
}

function handleFolderDoubleClick(folderKey: string) {
  updateSelectedKeys(folderKey)
  selectedStorageObjects.value = {}
}

function handleFileClick(file: StorageType) {
  selectedSidebarObject.value = file
  selectedStorageObjects.value[file.id] = file
}

onClickOutside(storageObjRef, () => {
  selectedStorageObjects.value = {}
})

watch(breadcrumbItems, async (v: Record<string, any>[]) => {
  await loadStorageByDirectory(v?.at(-1)?.key.split('/').slice(1).join('/'))
})
</script>

<template>
  <div v-show="currentDirectory">
    <div class="nc-storage-toolbar w-full py-2 flex gap-2 items-center h-[var(--toolbar-height)] px-2 border-b overflow-x-hidden">
      <LazyDashboardStorageManagerBreadcrumb />

      <div class="flex-1" />

      <LazyDashboardStorageManagerSearch />
    </div>

    <div class="nc-storage-window w-full py-1 flex gap-2 items-center px-2 overflow-x-hidden">
      <LazyDashboardStorageManagerToolbar />

      <div class="flex-1" />

      <LazyDashboardStorageManagerFileSidebar />
    </div>

    <div class="flex select-none text-center gap-4">
      <!-- Folders -->
      <a-card
        v-for="(folder, idx) of folders"
        ref="storageObjRef"
        :key="idx"
        hoverable
        class="w-[150px] cursor-pointer"
        :body-style="{ padding: '20px 5px' }"
        @click="handleFolderClick(folder.key, folder)"
        @dblclick="handleFolderDoubleClick(folder.key)"
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
      <a-card
        v-for="(file, idx) of storages"
        :key="idx"
        hoverable
        class="w-[150px] cursor-pointer"
        :body-style="{ padding: '20px 5px' }"
        @click="handleFileClick(file)"
      >
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
