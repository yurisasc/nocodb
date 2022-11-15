import { useInjectionState } from '#imports'

const [useProvideQuickImportStore, useQuickImportStore] = useInjectionState(
  (importType: 'csv' | 'json' | 'excel', importDataOnly = false) => {
    const { project } = useProject()

    const { t } = useI18n()

    const { $e, $api } = useNuxtApp()

    const importStepper = ref<number>(0)

    return {
      importStepper,
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
