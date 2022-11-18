<script setup lang="ts">
import type { TableType } from 'nocodb-sdk'
import type { UploadChangeParam, UploadFile } from 'ant-design-vue'
import { Upload } from 'ant-design-vue'
import {
  CSVTemplateAdapterV2,
  ExcelTemplateAdapterV2,
  ExcelUrlTemplateAdapter,
  Form,
  IsQuickImportInj,
  JSONTemplateAdapterV2,
  JSONUrlTemplateAdapter,
  computed,
  extractSdkResponseErrorMsg,
  fieldRequiredValidator,
  importCsvUrlValidator,
  importExcelUrlValidator,
  importUrlValidator,
  message,
  reactive,
  ref,
  useI18n,
  useProject,
  useQuickImportStoreOrThrow,
  useVModel,
} from '#imports'
import type { importFileList, streamImportFileList } from '~/lib'

interface Props {
  modelValue: boolean
  importType: 'csv' | 'json' | 'excel'
  importDataOnly?: boolean
}

const { importType, importDataOnly = false, ...rest } = defineProps<Props>()

const emit = defineEmits(['update:modelValue'])

useProvideQuickImportStore(importType, importDataOnly)

const { source, parserConfig, isImportTypeJson, isImportTypeCsv, IsImportTypeExcel, createTempTable, importTempTable } =
  useQuickImportStoreOrThrow()!

const { t } = useI18n()

const { tables, loadTables } = useProject()

const activeKey = ref('uploadTab')

const jsonEditorRef = ref()

const templateEditorRef = ref()

const preImportLoading = ref(false)

const importLoading = ref(false)

const templateData = ref()

const importData = ref()

const importColumns = ref([])

const isParsingData = ref(false)

const useForm = Form.useForm

const { IMPORT_STEPS, importStepper } = useQuickImportStoreOrThrow()!

const importState = reactive({
  fileList: [] as importFileList | streamImportFileList,
  url: '',
  jsonEditor: {},
  parserConfig: parserConfig.value,
})

const validators = computed(() => ({
  url: [fieldRequiredValidator(), importUrlValidator, isImportTypeCsv.value ? importCsvUrlValidator : importExcelUrlValidator],
}))

const { validate, validateInfos } = useForm(importState, validators)

const importMeta = computed(() => {
  if (IsImportTypeExcel.value) {
    return {
      header: `${t('title.quickImport')} - EXCEL`,
      uploadHint: t('msg.info.excelSupport'),
      urlInputLabel: t('msg.info.excelURL'),
      loadUrlDirective: ['c:quick-import:excel:load-url'],
      acceptTypes: '.xls, .xlsx, .xlsm, .ods, .ots',
    }
  } else if (isImportTypeCsv.value) {
    return {
      header: `${t('title.quickImport')} - CSV`,
      uploadHint: '',
      urlInputLabel: t('msg.info.csvURL'),
      loadUrlDirective: ['c:quick-import:csv:load-url'],
      acceptTypes: '.csv',
    }
  } else if (isImportTypeJson.value) {
    return {
      header: `${t('title.quickImport')} - JSON`,
      uploadHint: '',
      acceptTypes: '.json',
    }
  }
  return {}
})

const dialogShow = useVModel(rest, 'modelValue', emit)

const disablePreImportButton = computed(() => {
  if (activeKey.value === 'uploadTab') {
    return !(importState.fileList.length > 0)
  } else if (activeKey.value === 'urlTab') {
    if (!validateInfos.url.validateStatus) return true

    return validateInfos.url.validateStatus === 'error'
  } else if (activeKey.value === 'jsonEditorTab') {
    return !jsonEditorRef.value?.isValid
  }
})

const disableImportButton = computed(() => !templateEditorRef.value?.isValid)

const disableFormatJsonButton = computed(() => !jsonEditorRef.value?.isValid)

let templateGenerator: CSVTemplateAdapterV2 | JSONTemplateAdapterV2 | ExcelTemplateAdapterV2 | null

async function handlePreImport() {
  preImportLoading.value = true
  isParsingData.value = true

  if (activeKey.value === 'uploadTab') {
    if (isImportTypeCsv.value) {
      source.value = importState.fileList as streamImportFileList
      await parseAndExtractData()
    } else {
      source.value = (importState.fileList as importFileList)[0].data
      await parseAndExtractData()
    }
  } else if (activeKey.value === 'urlTab') {
    try {
      await validate()
      source.value = importState.url
      await parseAndExtractData()
    } catch (e: any) {
      message.error(await extractSdkResponseErrorMsg(e))
    }
  } else if (activeKey.value === 'jsonEditorTab') {
    source.value = JSON.stringify(importState.jsonEditor)
    await parseAndExtractData()
  }
}

async function handleImport() {
  try {
    if (!templateGenerator) {
      message.error(t('msg.error.templateGeneratorNotFound'))
      return
    }
    importLoading.value = true
    await templateEditorRef.value.importTemplate()
  } catch (e: any) {
    return message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    importLoading.value = false
  }
  dialogShow.value = false
}

// UploadFile[] for csv import (streaming)
// ArrayBuffer for excel import
// string for json import
async function parseAndExtractData() {
  try {
    templateData.value = null
    importData.value = null
    importColumns.value = []

    templateGenerator = getAdapter()

    if (!templateGenerator) {
      message.error(t('msg.error.templateGeneratorNotFound'))
      return
    }

    await templateGenerator.init()

    await templateGenerator.parse()

    templateData.value = templateGenerator!.getTemplate()

    const data = templateGenerator!.getData()

    if (importDataOnly) importColumns.value = templateGenerator!.getColumns()
    else {
      // ensure the target table name not exist in current table list
      templateData.value.tables = templateData.value.tables.map((table: Record<string, any>) => {
        const uniqueTn = populateUniqueTableName(table.table_name)
        // rename key in data
        delete Object.assign(data, { [uniqueTn]: data[table.table_name] })[table.table_name]
        return {
          ...table,
          table_name: uniqueTn,
        }
      })
    }

    await Promise.all(
      templateData.value.tables.map(async (table: Record<string, any>) => {
        await createTempTable(table)
      }),
    )

    await loadTables()

    // bulk import data to temp tables
    if (parserConfig.value.shouldImportData) {
      await Promise.all(
        Object.keys(data).map(async (tn: string) => {
          await importTempTable(tn, data[tn])
        }),
      )
    }

    importStepper.value = IMPORT_STEPS.STEP_2_REVIEW_DATA
  } catch (e: any) {
    message.error(await extractSdkResponseErrorMsg(e))
  } finally {
    isParsingData.value = false
    preImportLoading.value = false
  }
}

function rejectDrop(fileList: UploadFile[]) {
  fileList.map((file) => {
    return message.error(`${t('msg.error.fileUploadFailed')} ${file.name}`)
  })
}

function handleChange(info: UploadChangeParam) {
  const status = info.file.status
  if (status && status !== 'uploading' && status !== 'removed') {
    if (isImportTypeCsv.value) {
      if (!importState.fileList.find((f) => f.uid === info.file.uid)) {
        ;(importState.fileList as streamImportFileList).push({
          ...info.file,
          status: 'done',
        })
      }
    } else {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const target = (importState.fileList as importFileList).find((f) => f.uid === info.file.uid)
        if (e.target && e.target.result) {
          /** if the file was pushed into the list by `<a-upload-dragger>` we just add the data to the file */
          if (target) {
            target.data = e.target.result
          } else if (!target) {
            /** if the file was added programmatically and not with d&d, we create file infos and push it into the list */
            importState.fileList.push({
              ...info.file,
              status: 'done',
              data: e.target.result,
            })
          }
        }
      }
      reader.readAsArrayBuffer(info.file.originFileObj!)
    }
  }

  if (status === 'done') {
    message.success(`Uploaded file ${info.file.name} successfully`)
  } else if (status === 'error') {
    message.error(`${t('msg.error.fileUploadFailed')} ${info.file.name}`)
  }
}

function formatJson() {
  jsonEditorRef.value?.format()
}

function populateUniqueTableName(tn: string) {
  let c = 1
  while (
    tables.value.some((t: TableType) => {
      const s = t.table_name.split('___')
      let target = t.table_name
      if (s.length > 1) target = s[1]
      return target === `${tn}`
    })
  ) {
    tn = `${tn}_${c++}`
  }
  return tn
}

function getAdapter() {
  if (isImportTypeCsv.value) {
    switch (activeKey.value) {
      case 'uploadTab':
        return new CSVTemplateAdapterV2(source.value as UploadFile[], {
          ...importState.parserConfig,
          importFromURL: false,
        })
      case 'urlTab':
        return new CSVTemplateAdapterV2(source.value as string, {
          ...importState.parserConfig,
          importFromURL: true,
        })
    }
  } else if (IsImportTypeExcel.value) {
    switch (activeKey.value) {
      case 'uploadTab':
        return new ExcelTemplateAdapterV2(source.value as ArrayBuffer, importState.parserConfig)
      case 'urlTab':
        return new ExcelUrlTemplateAdapter(source.value as string, importState.parserConfig)
    }
  } else if (isImportTypeJson.value) {
    switch (activeKey.value) {
      case 'uploadTab':
      case 'jsonEditorTab':
        return new JSONTemplateAdapterV2(source.value as object, importState.parserConfig)
      case 'urlTab':
        return new JSONUrlTemplateAdapter(source.value as string, importState.parserConfig)
    }
  }

  return null
}

defineExpose({
  handleChange,
})

/** a workaround to override default antd upload api call */
const customReqCbk = (customReqArgs: { file: any; onSuccess: () => void }) => {
  importState.fileList.forEach((f) => {
    if (f.uid === customReqArgs.file.uid) {
      f.status = 'done'
      handleChange({ file: f, fileList: importState.fileList })
    }
  })
  customReqArgs.onSuccess()
}

/** check if the file size exceeds the limit */
const beforeUpload = (file: UploadFile) => {
  const exceedLimit = file.size! / 1024 / 1024 > 5
  if (exceedLimit) {
    message.error(`File ${file.name} is too big. The accepted file size is less than 5MB.`)
  }
  return !exceedLimit || Upload.LIST_IGNORE
}

provide(IsQuickImportInj, ref(true))
</script>

<template>
  <a-modal
    v-model:visible="dialogShow"
    width="100%"
    wrap-class-name="nc-modal-quick-import nc-fullscreen-modal "
    @keydown.esc="dialogShow = false"
  >
    <a-spin :spinning="isParsingData" tip="Parsing Data ..." size="large">
      <div class="px-5">
        <div class="prose-xl font-weight-bold my-5">{{ importMeta.header }}</div>

        <LazyQuickImportStepper />

        <div class="mt-5">
          <!-- Step 1: Upload Data -->
          <a-tabs
            v-if="importStepper === IMPORT_STEPS.STEP_1_UPLOAD_DATA"
            v-model:activeKey="activeKey"
            hide-add
            type="editable-card"
            tab-position="top"
          >
            <a-tab-pane key="uploadTab" :closable="false">
              <template #tab>
                <!--              Upload -->
                <div class="flex items-center gap-2">
                  <MdiFileUploadOutline />
                  {{ $t('general.upload') }}
                </div>
              </template>

              <div class="py-6">
                <a-upload-dragger
                  v-model:fileList="importState.fileList"
                  name="file"
                  class="nc-input-import !scrollbar-thin-dull"
                  list-type="picture"
                  :accept="importMeta.acceptTypes"
                  :max-count="isImportTypeCsv ? 5 : 1"
                  :multiple="true"
                  :custom-request="customReqCbk"
                  :before-upload="beforeUpload"
                  @change="handleChange"
                  @reject="rejectDrop"
                >
                  <MdiFilePlusOutline size="large" />

                  <!-- Click or drag file to this area to upload -->
                  <p class="ant-upload-text">{{ $t('msg.info.import.clickOrDrag') }}</p>

                  <p class="ant-upload-hint">
                    {{ importMeta.uploadHint }}
                  </p>
                </a-upload-dragger>
              </div>
            </a-tab-pane>

            <a-tab-pane v-if="isImportTypeJson" key="jsonEditorTab" :closable="false">
              <template #tab>
                <span class="flex items-center gap-2">
                  <MdiCodeJson />
                  JSON Editor
                </span>
              </template>

              <div class="pb-3 pt-3">
                <LazyMonacoEditor ref="jsonEditorRef" v-model="importState.jsonEditor" class="min-h-60 max-h-80" />
              </div>
            </a-tab-pane>

            <a-tab-pane v-else key="urlTab" :closable="false">
              <template #tab>
                <span class="flex items-center gap-2">
                  <MdiLinkVariant />
                  URL
                </span>
              </template>

              <div class="pr-10 pt-5">
                <a-form :model="importState" name="quick-import-url-form" layout="horizontal" class="mb-0">
                  <a-form-item :label="importMeta.urlInputLabel" v-bind="validateInfos.url">
                    <a-input v-model:value="importState.url" size="large" />
                  </a-form-item>
                </a-form>
              </div>
            </a-tab-pane>
          </a-tabs>

          <LazyQuickImportAdvancedSettings v-if="importStepper === IMPORT_STEPS.STEP_1_UPLOAD_DATA" />

          <!-- Step 2: Review Data -->
          <LazyQuickImportEditor
            v-if="importStepper === IMPORT_STEPS.STEP_2_REVIEW_DATA"
            ref="templateEditorRef"
            class="nc-quick-import-template-editor"
          />
        </div>
      </div>
    </a-spin>
    <template #footer>
      <template v-if="importStepper === IMPORT_STEPS.STEP_1_UPLOAD_DATA">
        <a-button
          key="pre-import"
          type="primary"
          class="nc-btn-import"
          :loading="preImportLoading"
          :disabled="disablePreImportButton"
          @click="handlePreImport"
        >
          {{ $t('activity.import') }}
        </a-button>

        <a-button v-if="activeKey === 'jsonEditorTab'" key="format" :disabled="disableFormatJsonButton" @click="formatJson">
          Format JSON
        </a-button>
      </template>

      <template v-if="importStepper === IMPORT_STEPS.STEP_2_REVIEW_DATA">
        <a-button key="back" @click="importStepper = IMPORT_STEPS.STEP_1_UPLOAD_DATA"> Back </a-button>
      </template>

      <template v-if="importStepper === IMPORT_STEPS.STEP_3_LOAD_TO_DATABASE">
        <a-button key="import" type="primary" :loading="importLoading" :disabled="disableImportButton" @click="handleImport">
          {{ $t('activity.import') }}
        </a-button>
      </template>

      <a-button key="cancel" @click="dialogShow = false">{{ $t('general.cancel') }}</a-button>
    </template>
  </a-modal>
</template>
