<script setup lang="ts">
import { useI18n, useNuxtApp, useProvideStorageManagerStore, useUIPermission, useVModel } from '#imports'

interface Props {
  modelValue: boolean
  openKey?: string
}

const props = defineProps<Props>()

const emits = defineEmits(['update:modelValue'])

const vModel = useVModel(props, 'modelValue', emits)

const { isUIAllowed } = useUIPermission()

const { t } = useI18n()

const { $e } = useNuxtApp()

useProvideStorageManagerStore()
</script>

<template>
  <a-modal
    v-model:visible="vModel"
    :footer="null"
    width="max(90vw, 600px)"
    :closable="false"
    wrap-class-name="nc-modal-settings"
    @cancel="emits('update:modelValue', false)"
  >
    <!-- Storage Manager -->
    <div class="flex flex-row justify-between w-full items-center mb-1">
      <a-typography-title class="ml-4 select-none" type="secondary" :level="5">
        {{ $t('title.storageManager') }}
      </a-typography-title>

      <a-button type="text" class="!rounded-md border-none -mt-1.5 -mr-1" @click="vModel = false">
        <template #icon>
          <MdiClose class="cursor-pointer mt-1 nc-modal-close" />
        </template>
      </a-button>
    </div>

    <a-layout class="mt-3 h-full overflow-y-auto flex">
      <!-- Directory Tree -->
      <a-layout-sider class="h-full overflow-auto">
        <LazyDashboardStorageManagerDirectoryTree />
      </a-layout-sider>

      <!-- Explorer -->
      <a-layout-content class="h-auto px-4 scrollbar-thumb-gray-500">
        <LazyDashboardStorageManagerExplorer />
      </a-layout-content>
    </a-layout>
  </a-modal>
</template>
