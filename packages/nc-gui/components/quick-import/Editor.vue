<script setup lang="ts">
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import type { ColumnType, TableType } from 'nocodb-sdk'
import { UITypes, isSystemColumn, isVirtualCol } from 'nocodb-sdk'
import { srcDestMappingColumns, tableColumns } from '../template/utils'
import {
  Empty,
  Form,
  MetaInj,
  ReloadViewDataHookInj,
  computed,
  createEventHook,
  extractSdkResponseErrorMsg,
  fieldRequiredValidator,
  getDateFormat,
  getDateTimeFormat,
  getUIDTIcon,
  inject,
  message,
  nextTick,
  onMounted,
  parseStringDate,
  reactive,
  ref,
  useI18n,
  useNuxtApp,
  useProject,
  useTabs,
} from '#imports'
import { TabType } from '~/lib'

const { quickImportType, projectTemplate, importData, importColumns, importDataOnly, maxRowsToParse } = defineProps<Props>()

const emit = defineEmits(['import'])

dayjs.extend(utc)

const { t } = useI18n()

const meta = inject(MetaInj, ref())

const columns = computed(() => meta.value?.columns || [])

const reloadHook = inject(ReloadViewDataHookInj, createEventHook())

const useForm = Form.useForm

const { $api } = useNuxtApp()

const { sqlUi, project, loadTables } = useProject()
</script>

<template>
  <LazySmartsheetGrid />
</template>

<style scoped lang="scss"></style>
