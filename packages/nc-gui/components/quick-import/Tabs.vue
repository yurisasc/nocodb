<script setup lang="ts">
import { useGlobal, useQuickImportStoreOrThrow } from '#imports'
const { isLoading } = useGlobal()
const { activeTabIndex, closeQuickImportTab, quickImportTabs } = useQuickImportStoreOrThrow()!

function onEdit(targetKey: number, action: 'add' | 'remove' | string) {
  if (action === 'remove') {
    closeQuickImportTab(targetKey)
  }
}
</script>

<template>
  <div class="h-full w-full nc-container">
    <div class="h-full w-full flex flex-col">
      <div class="flex items-end !min-h-[var(--header-height)] nc-tab-bar">
        <a-tabs v-model:activeKey="activeTabIndex" class="nc-root-tabs" type="editable-card" @edit="onEdit">
          <a-tab-pane v-for="(tab, i) of quickImportTabs" :key="i">
            <template #tab>
              <div class="flex items-center gap-2 max-w-[110px]">
                <div class="flex items-center">
                  <MdiTableLarge class="text-sm" />
                </div>

                <a-tooltip v-if="tab.title?.length > 12" placement="bottom">
                  <div class="truncate" :data-testid="`nc-root-tabs-${tab.title}`">{{ tab.title }}</div>

                  <template #title>
                    <div>{{ tab.title }}</div>
                  </template>
                </a-tooltip>

                <div v-else :data-testid="`nc-root-tabs-${tab.title}`">{{ tab.title }}</div>
              </div>
            </template>
          </a-tab-pane>
        </a-tabs>
        <span class="flex-1" />
        <div class="flex justify-center self-center mr-2 min-w-[115px]">
          <div v-show="isLoading" class="flex items-center gap-2 ml-3 text-gray-200" data-testid="nc-loading">
            {{ $t('general.loading') }}
            <MdiLoading class="animate-infinite animate-spin" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
