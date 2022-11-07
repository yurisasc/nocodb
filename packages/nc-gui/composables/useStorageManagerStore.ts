import type { TreeProps } from 'ant-design-vue'
import { useInjectionState } from '#imports'

const [useProvideStorageManagerStore, useStorageManagerStore] = useInjectionState(() => {
  // const { t } = useI18n()

  const { api } = useApi()

  const { project } = useProject()

  // the keys of the expanded treeNodes
  const directoryTreeExpandedKeys = ref<string[]>([])
  // the keys of the selected treeNodes
  const directoryTreeSelectedKeys = ref<string[]>([])
  // directory treeNodes
  const directoryTree = ref<TreeProps['treeData']>([])
  // the selected directory path
  const directory = computed(() => directoryTreeSelectedKeys.value?.[0])
  // the breadcrumb items of the selected directory path
  const breadcrumbItems = computed(() => directory.value?.split('/'))

  // TODO(storage): types
  function getTreeNodeChildren(treeNodes: any, parentDirectory: string, treeNodeAdj: any): any {
    if (!treeNodes?.size) return []
    const children = []
    for (const treeNode of treeNodes) {
      const currentDirectory = `${parentDirectory}/${treeNode}`
      children.push({
        title: treeNode,
        key: currentDirectory,
        children: getTreeNodeChildren(treeNodeAdj[treeNode], currentDirectory, treeNodeAdj),
      })
    }
    return children
  }

  async function loadDirectoryTree() {
    if (!project.value.id) {
      return
    }
    const storages = (await api.project.storageList(project.value.id)).list!

    const directoryTreeMap: Record<string, any> = {}

    for (const storage of storages) {
      if (!(storage.source! in directoryTreeMap)) {
        directoryTreeMap[storage.source!] = []
      }
      if (storage.meta) {
        directoryTreeMap[storage.source!].push(typeof storage.meta === 'string' ? JSON.parse(storage.meta) : storage.meta)
      }
    }

    for (const key of Object.keys(directoryTreeMap)) {
      const treeNodeAdj: Record<string, Set<string>> = {}
      for (const treeNode of directoryTreeMap[key]) {
        const directory = treeNode.directory
        const directorySegments = directory.split('/')
        treeNodeAdj[key] = new Set<string>()
        for (let i = 0; i < directorySegments.length; i++) {
          if (i === 0) {
            treeNodeAdj[key].add(directorySegments[i])
          }
          if (i + 1 < directorySegments.length && directorySegments[i + 1] !== '') {
            if (!treeNodeAdj[directorySegments[i]]) {
              treeNodeAdj[directorySegments[i]] = new Set<string>()
            }
            treeNodeAdj[directorySegments[i]].add(directorySegments[i + 1])
          }
        }
      }

      directoryTree.value.push({
        title: key,
        key,
        children: getTreeNodeChildren(treeNodeAdj[key], key, treeNodeAdj),
      })
    }
    loadDirectoryTreeExpandedKeys()
  }

  function loadDirectoryTreeExpandedKeys() {
    // expand the first level parent treeNodes
    directoryTreeExpandedKeys.value = directoryTree.value?.reduce((acc: string[], obj: TreeProps['treeData']) => {
      acc.push(obj.key)
      return acc
    }, [])
  }

  return {
    directoryTree,
    directoryTreeSelectedKeys,
    directoryTreeExpandedKeys,
    directory,
    breadcrumbItems,
    loadDirectoryTree,
    loadDirectoryTreeExpandedKeys,
  }
}, 'storage-manager-store')

export { useProvideStorageManagerStore }

export function useStorageManagerStoreOrThrow() {
  const storageManagerStore = useStorageManagerStore()
  if (storageManagerStore == null) throw new Error('Please call `useStorageManagerStore` on the appropriate parent component')
  return storageManagerStore
}
