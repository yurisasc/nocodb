<script setup lang="ts">
import { onClickOutside, useStorageManagerStoreOrThrow } from '#imports'

const { selectedStorageObjects } = useStorageManagerStoreOrThrow()

const { t } = useI18n()

const fileSidebarRef = ref()

const fileSidebarData = computed(() => {
  const res: Record<string, any> = []
  if (selectedStorageObjects.value && selectedStorageObjects.value.length === 1) {
    for (const [k, v] of Object.entries(selectedStorageObjects.value[0])) {
      if (['source', 'url', 'mimetype', 'size', 'created_at', 'updated_at'].includes(k)) {
        res.push({
          key: k.split("_")[0],
          value: v,
        })
      }
    }
  }
  return res
})

onClickOutside(fileSidebarRef, () => {
  selectedStorageObjects.value = []
})
</script>

<template>
  <a-drawer
    ref="fileSidebarRef"
    v-model:visible="selectedStorageObjects.length"
    placement="right"
    :closable="true"
    :get-container="false"
    :style="{ position: 'absolute' }"
    :mask="false"
    :header-style="{ padding: '13px 24px' }"
    @keydown.esc="selectedStorageObjects = []"
  >
    <template #title>
      <div class="flex items-center">
        <MdiAlertCircleOutline class="mr-2"/>
        {{ t('title.fileDetails')}}
      </div>
    </template>
    <a-list item-layout="horizontal" :data-source="fileSidebarData">
      <template #renderItem="{ item }">
        <a-list-item>
          <a-list-item-meta>
            <template #title>
              <span class="capitalize">
                {{ item.key }}
              </span>
            </template>
            <template #description>
              {{ item.value }}
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>
    </a-list>
  </a-drawer>
</template>
