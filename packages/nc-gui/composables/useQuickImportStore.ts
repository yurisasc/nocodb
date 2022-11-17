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
    const { project, tables } = useProject()

    const { t } = useI18n()

    const { $e, $api } = useNuxtApp()

    const quickImportTabs = ref<TabItem[]>([])

    const activeTabIndex = ref<number>(0)

    const previousActiveTabIndex = ref(-1)

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

    const importStepper = ref<number>(IMPORT_STEPS.STEP_2_REVIEW_DATA)

    const source = ref<UploadFile[] | ArrayBuffer | string | object>()

    const parserConfig = ref<Record<string, any>>({
      maxRowsToParse: 500,
      normalizeNested: true,
      autoSelectFieldTypes: true,
      firstRowAsHeaders: true,
      shouldImportData: true,
      importFromURL: false,
    })

    const importedTables = ref<TableType[]>([])

    const { table, createTable } = useTable(async (table) => {
      importedTables.value.push(table)
    })

    const isImportTypeJson = computed(() => importType === 'json')

    const isImportTypeCsv = computed(() => importType === 'csv')

    const IsImportTypeExcel = computed(() => importType === 'excel')

    async function _createTempTable(source: string | UploadFile) {
      // leave title empty to get a generated one based on   table_name
      table.title = ''
      table.table_name = generateUniqueTitle(
        `NC_IMPORT_TABLE_${(
          (parserConfig.value.importFromURL ? (source as string).split('/').pop() : (source as UploadFile).name) as string
        )
          .replace(/[` ~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, '_')
          .trim()!}`,
        tables.value,
        'table_name',
      )
      table.columns = ['id', 'created_at', 'updated_at']
      await createTable()
    }

    async function createTempTable() {
      if (parserConfig.value.importFromURL) {
        await _createTempTable(source.value as string)
      } else {
        await Promise.all(
          (source.value as UploadFile[]).map((file: UploadFile, tableIdx: number) =>
            (async (f) => {
              await _createTempTable(f)
            })(file),
          ),
        )
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
      parserConfig,
      // Tabs
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
