<script setup lang="ts">
import { onClickOutside, useStorageManagerStoreOrThrow } from '#imports'

const { selectedSidebarObject } = useStorageManagerStoreOrThrow()

const { t } = useI18n()

const fileSidebarRef = ref()

const fileSidebarData = computed(() => {
  const res: Record<string, any>[] = []
  if (selectedSidebarObject.value && Object.keys(selectedSidebarObject.value).length) {
    for (const [k, v] of Object.entries(selectedSidebarObject.value)) {
      if (['source', 'url', 'mimetype', 'size', 'created_at', 'updated_at'].includes(k)) {
        res.push({
          key: k.split('_')[0],
          value: v,
        })
      }
    }
  }
  return res
})

onClickOutside(fileSidebarRef, () => {
  selectedSidebarObject.value = {}
})
</script>

<template>
  <a-drawer
    ref="fileSidebarRef"
    v-model:visible="Object.keys(selectedSidebarObject).length"
    placement="right"
    :closable="true"
    :get-container="false"
    :style="{ position: 'absolute' }"
    :mask="false"
    :header-style="{ padding: '13px 24px' }"
    @keydown.esc="selectedSidebarObject = {}"
  >
    <template #title>
      <div class="flex items-center">
        <MdiAlertCircleOutline class="mr-2" />
        {{ t('title.fileDetails') }}
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
