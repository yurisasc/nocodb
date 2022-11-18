<script setup lang="ts">
import type { TableType } from 'nocodb-sdk'
import { ActiveViewInj, computed, ref, toRefs, useI18n, useNuxtApp, useProject } from '#imports'
import type { TabItem } from '~/lib'

const { t } = useI18n()

const { $api } = useNuxtApp()

const { sqlUi, project } = useProject()

const { activeQuickImportTab, quickImportTabs, activeTabIndex, closeQuickImportTab } = useQuickImportStoreOrThrow()!

const { metas, getMeta } = useMetas()

const meta = computed<TableType | undefined>(() => activeQuickImportTab.value && metas.value[activeQuickImportTab.value.id!])

const { views, isLoading } = useViews(meta)

const activeView = computed(() => views.value[0])

const { loadData } = useViewData(meta, activeView)

useProvideSmartsheetStore(activeView, meta)

provide(MetaInj, meta)

provide(ActiveViewInj, activeView)

provide(FieldsInj, ref(meta.value?.columns || []))

watch(activeQuickImportTab, async () => {
  // include the quick import table in metas
  await getMeta(activeQuickImportTab.value?.id!)
  // load data
  await loadData()
})
</script>

<template>
  <a-layout>
    <a-layout-sider theme="light">
      <LazyDashboardTreeView />
    </a-layout-sider>
    <a-layout-content>
      <div class="nc-container flex flex-col h-full mt-1.5 px-12">
        <LazyQuickImportTabs />
        <LazySmartsheetToolbar />
        <LazySmartsheetGrid />
      </div>
    </a-layout-content>
  </a-layout>
</template>

<style scoped lang="scss"></style>
