import type { UploadFile } from 'ant-design-vue'
import type { TableType } from 'nocodb-sdk'
import { generateUniqueTitle, useInjectionState } from '#imports'
import type { TabItem } from '~/lib'

const [useProvideQuickImportStore, useQuickImportStore] = useInjectionState(
  (importType: 'csv' | 'json' | 'excel', importDataOnly = false) => {
    enum IMPORT_STEPS {
      STEP_1_UPLOAD_DATA = 0,
      STEP_2_REVIEW_DATA = 1,
      STEP_3_LOAD_TO_DATABASE = 2,
    }
    const { project } = useProject()

    const { t } = useI18n()

    const { $e, $api } = useNuxtApp()

    const quickImportTabs = ref<TabItem[]>([])

    const activeTabIndex = ref<number>(0)

    const previousActiveTabIndex = ref(-1)

    const activeQuickImportTab = computed(() => quickImportTabs.value?.[activeTabIndex.value])

    const getPredicate = (key: Partial<TabItem>) => {
      return (tab: TabItem) =>
        (!('id' in key) || tab.id === key.id) &&
        (!('title' in key) || tab.title === key.title) &&
        (!('type' in key) || tab.type === key.type)
    }

    const addQuickImportTab = (tabMeta: TabItem) => {
      tabMeta.sortsState = tabMeta.sortsState || new Map()
      tabMeta.filterState = tabMeta.filterState || new Map()
      const tabIndex = quickImportTabs.value.findIndex((tab) => tab.id === tabMeta.id)
      // if tab already found make it active
      if (tabIndex > -1) {
        activeTabIndex.value = tabIndex
      }
      // if tab not found add it
      else {
        quickImportTabs.value = [...(quickImportTabs.value || []), tabMeta]
        activeTabIndex.value = quickImportTabs.value.length - 1
      }
    }

    const closeQuickImportTab = async (key: number | Partial<TabItem>) => {
      const index = typeof key === 'number' ? key : quickImportTabs.value.findIndex(getPredicate(key))
      quickImportTabs.value.splice(index, 1)
    }

    const updateQuickImportTab = (key: number | Partial<TabItem>, newTabItemProps: Partial<TabItem>) => {
      const tab = typeof key === 'number' ? quickImportTabs.value[key] : quickImportTabs.value.find(getPredicate(key))

      if (tab) {
        const isActive = quickImportTabs.value.indexOf(tab) === previousActiveTabIndex.value
        Object.assign(tab, newTabItemProps)
      }
    }

    const importStepper = ref<number>(IMPORT_STEPS.STEP_1_UPLOAD_DATA)

    const source = ref<UploadFile[] | ArrayBuffer | string | object>()

    const parserConfig = ref<Record<string, any>>({
      maxRowsToParse: 500,
      normalizeNested: true,
      autoSelectFieldTypes: true,
      firstRowAsHeaders: true,
      shouldImportData: true,
      importFromURL: false,
    })

    // raw table name --> Title created in DB
    const tnMappings = ref<Record<string, any>>({})

    const { table, createTable } = useTable(async (t) => {
      tnMappings.value[table.table_name] = t.title
    })

    const isImportTypeJson = computed(() => importType === 'json')

    const isImportTypeCsv = computed(() => importType === 'csv')

    const IsImportTypeExcel = computed(() => importType === 'excel')

    async function createTempTable(t: Record<string, any>) {
      // leave title empty to get a generated one based on table_name
      table.title = ''
      table.table_name = t.table_name
      table.columns = [
        'id',
        'created_at',
        'updated_at',
        ...t.columns.map((t: { column_name: string; key: number }) => t.column_name),
      ]

      await createTable()
    }

    async function importTempTable(tableTitle: string, data: Record<string, any>[]) {
      if (data) {
        const offset = parserConfig.value.maxRowsToParse
        for (let i = 0; i < data.length; i += offset) {
          const batchData = data.slice(i, i + offset)
          await $api.dbTableRow.bulkCreate('noco', project.value.title!, tnMappings.value[tableTitle], batchData)
        }
      }
    }
    return {
      IMPORT_STEPS,
      source,
      importType,
      importDataOnly,
      importStepper,
      isImportTypeJson,
      isImportTypeCsv,
      IsImportTypeExcel,
      createTempTable,
      importTempTable,
      parserConfig,
      // Tabs
      activeQuickImportTab,
      activeTabIndex,
      quickImportTabs,
      addQuickImportTab,
      closeQuickImportTab,
      updateQuickImportTab,
    }
  },
  'quick-import-store',
)

export { useProvideQuickImportStore }

export function useQuickImportStoreOrThrow() {
  const quickImportStore = useQuickImportStore()

  if (quickImportStore === null) {
    throw new Error('Please call `useProvideQuickImportStore` on the appropriate parent component')
  }
  return quickImportStore
}
