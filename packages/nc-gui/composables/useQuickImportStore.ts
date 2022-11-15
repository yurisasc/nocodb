import type { UploadFile } from 'ant-design-vue'
import { generateUniqueTitle, useInjectionState } from '#imports'

const [useProvideQuickImportStore, useQuickImportStore] = useInjectionState(
  (importType: 'csv' | 'json' | 'excel', importDataOnly = false) => {
    const { project, tables } = useProject()

    const { t } = useI18n()

    const { $e, $api } = useNuxtApp()

    const importStepper = ref<number>(0)

    const source = ref<UploadFile[] | ArrayBuffer | string | object>()

    const parserConfig = ref<Record<string, any>>({
      maxRowsToParse: 500,
      normalizeNested: true,
      autoSelectFieldTypes: true,
      firstRowAsHeaders: true,
      shouldImportData: true,
      importFromURL: false,
    })

    const importedTables = ref<String[]>([])

    const { table, createTable } = useTable(async (table) => {
      importedTables.value.push(table.table_name)
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
      source,
      importStepper,
      isImportTypeJson,
      isImportTypeCsv,
      IsImportTypeExcel,
      createTempTable,
      parserConfig,
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
