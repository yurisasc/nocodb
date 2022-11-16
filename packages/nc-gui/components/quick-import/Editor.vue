<script setup lang="ts">
import { MetaInj, ReloadViewDataHookInj, computed, createEventHook, inject, ref, useI18n, useNuxtApp, useProject } from '#imports'

const { t } = useI18n()

const meta = inject(MetaInj, ref())

const columns = computed(() => meta.value?.columns || [])

const reloadHook = inject(ReloadViewDataHookInj, createEventHook())

const { $api } = useNuxtApp()

const { sqlUi, project } = useProject()
</script>

<template>
  <a-layout>
    <a-layout-sider theme="light">
      <LazyDashboardTreeView />
    </a-layout-sider>
    <a-layout-content>
      <div class="nc-container flex flex-col h-full mt-1.5 px-12">
        <LazySmartsheetGrid />
      </div>
    </a-layout-content>
  </a-layout>
</template>

<style scoped lang="scss"></style>
