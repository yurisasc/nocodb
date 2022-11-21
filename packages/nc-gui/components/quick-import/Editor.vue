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

const activeView = ref()

const reloadEventHook = createEventHook<void | boolean>()

const reloadViewMetaEventHook = createEventHook<void | boolean>()

const openNewRecordFormHook = createEventHook<void>()

provide(MetaInj, meta)

provide(ActiveViewInj, activeView)

provide(FieldsInj, ref(meta.value?.columns || []))

provide(ReloadViewDataHookInj, reloadEventHook)

provide(ReloadViewMetaHookInj, reloadViewMetaEventHook)

provide(OpenNewRecordFormHookInj, openNewRecordFormHook)

useProvideSmartsheetStore(activeView, meta)

const { loadData } = useViewData(meta, activeView)

watch(activeQuickImportTab, async () => {
  // include the quick import table in metas
  await getMeta(activeQuickImportTab.value?.id!)
})

watch(views, async () => {
  // update active view
  activeView.value = views.value[0]
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
