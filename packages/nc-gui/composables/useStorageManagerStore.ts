import { useInjectionState } from '#imports'

const [useProvideStorageManagerStore, useStorageManagerStore] = useInjectionState(() => {
  const { t } = useI18n()

  const { api } = useApi()

  const { project } = useProject()

  const { $e, $api } = useNuxtApp()

  return {}
}, 'storage-manager-store')

export { useProvideStorageManagerStore }

export function useStorageManagerStoreOrThrow() {
  const storageManagerStore = useStorageManagerStore()
  if (storageManagerStore == null) throw new Error('Please call `useStorageManagerStore` on the appropriate parent component')
  return storageManagerStore
}
