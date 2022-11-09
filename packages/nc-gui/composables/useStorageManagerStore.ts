import type { TreeProps } from 'ant-design-vue'
import type { StorageType } from 'nocodb-sdk'
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
  // the storages data displayed in storage manager explorer
  const storages = ref<StorageType[]>([])
  // the selected directory path
  const directory = computed(() => directoryTreeSelectedKeys.value?.[0])
  // the breadcrumb items of the selected directory path
  const breadcrumbItems = computed(() => {
    const segments = directory.value?.split('/')
    const res: Record<string, any>[] = []
    if (!segments?.length) return res
    let prevDirectory = ''
    for (let i = 0; i < segments.length; i++) {
      const currentDirectory = prevDirectory ? `${prevDirectory}/${segments[i]}` : segments[i]
      res.push({
        title: segments[i],
        key: currentDirectory,
      })
      prevDirectory = currentDirectory
    }
    return res
  })
  const selectedStorageObjects = ref<Record<string, StorageType>>({})
  const selectedSidebarObject = ref<StorageType>({})

  // TODO(storage): types
  function getTreeNodeChildren(treeNodes: any, parentDirectory: string, treeNodeAdj: any): any {
    if (!treeNodes?.size) return []
    const children = []
    for (const treeNode of treeNodes) {
      const currentDirectory = `${parentDirectory}/${treeNode}`
      children.push({
        title: treeNode,
        key: currentDirectory,
        children: getTreeNodeChildren(treeNodeAdj[currentDirectory], currentDirectory, treeNodeAdj),
      })
    }
    return children.sort((x: any, y: any) => (x.title > y.title ? 1 : -1))
  }

  async function loadDirectoryTree() {
    if (!project.value.id) {
      return
    }
    const storageList = (await api.project.storageList(project.value.id)).list!
    const directoryTreeMap: Record<string, any> = {}
    for (const storage of storageList) {
      if (!(storage.source! in directoryTreeMap)) directoryTreeMap[storage.source!] = []
      directoryTreeMap[storage.source!].push(storage)
    }

    for (const key of Object.keys(directoryTreeMap)) {
      const treeNodeAdj: Record<string, Set<string>> = {}
      treeNodeAdj[key] = new Set<string>()
      for (const treeNode of directoryTreeMap[key]) {
        const directory = treeNode.directory
        const directorySegments = directory.split('/')
        treeNodeAdj[key].add(directorySegments[0])
        let parentDirectory = key
        for (let i = 0; i < directorySegments.length; i++) {
          const currentDirectory = `${parentDirectory}/${directorySegments[i]}`
          if (directorySegments[i + 1]) {
            if (!treeNodeAdj[currentDirectory]) {
              treeNodeAdj[currentDirectory] = new Set<string>()
            }
            treeNodeAdj[currentDirectory].add(directorySegments[i + 1])
          }
          parentDirectory = currentDirectory
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

  async function loadStorageByDirectory(directory: string) {
    storages.value = []
    if (directory) storages.value = (await api.project.storageList(project.value.id, { directory })).list!
  }

  function loadDirectoryTreeExpandedKeys() {
    // expand the first level parent treeNodes
    directoryTreeExpandedKeys.value = directoryTree.value?.reduce((acc: string[], obj: TreeProps['treeData']) => {
      acc.push(obj.key)
      return acc
    }, [])
  }

  function updateSelectedKeys(keys: string) {
    directoryTreeSelectedKeys.value = [keys]
    const directoryTreeExpandedKeysArr: string[] = []
    keys.split('/')?.forEach((key: string) => {
      if (!directoryTreeExpandedKeysArr.length) directoryTreeExpandedKeysArr.push(key)
      else directoryTreeExpandedKeysArr.push(`${directoryTreeExpandedKeysArr.at(-1)}/${key}`)
    })
    directoryTreeExpandedKeys.value = directoryTreeExpandedKeysArr
  }

  return {
    storages,
    selectedStorageObjects,
    selectedSidebarObject,
    directoryTree,
    directoryTreeSelectedKeys,
    directoryTreeExpandedKeys,
    directory,
    breadcrumbItems,
    loadDirectoryTree,
    loadDirectoryTreeExpandedKeys,
    loadStorageByDirectory,
    updateSelectedKeys,
  }
}, 'storage-manager-store')

export { useProvideStorageManagerStore }

export function useStorageManagerStoreOrThrow() {
  const storageManagerStore = useStorageManagerStore()
  if (storageManagerStore == null) throw new Error('Please call `useStorageManagerStore` on the appropriate parent component')
  return storageManagerStore
}
