import Noco from '../Noco';
import {
  CacheDelDirection,
  CacheGetType,
  CacheScope,
  MetaTable,
} from '../utils/globals';
import NocoCache from '../cache/NocoCache';
import { StorageType } from 'nocodb-sdk';
import { extractProps } from '../meta/helpers/extractProps';

export default class Storage implements StorageType {
  id: string;
  base_id: string;
  project_id: string;
  source: string;
  title: string;
  description: string;
  directory: string;
  url: string;
  mimetype: string;
  size: number;
  meta: string;

  constructor(data: Partial<Storage>) {
    Object.assign(this, data);
  }

  public static async insert(
    storageBody: StorageType & {
      created_at?;
      updated_at?;
    },
    ncMeta = Noco.ncMeta
  ): Promise<Storage> {
    const insertObj = {
      base_id: storageBody.base_id,
      project_id: storageBody.project_id,
      source: storageBody.source,
      title: storageBody.title,
      description: storageBody.description,
      directory: storageBody.directory,
      url: storageBody.url,
      mimetype: storageBody.mimetype,
      size: storageBody.size,
      meta: storageBody.meta,
    };
    const { id: storageId } = await ncMeta.metaInsert2(
      null,
      null,
      MetaTable.STORAGES,
      insertObj
    );

    await NocoCache.appendToList(
      CacheScope.STORAGE,
      [insertObj.project_id],
      `${CacheScope.STORAGE}:${storageId}`
    );
    return this.get(storageId, ncMeta);
  }

  public static async list(
    projectId: string,
    param?: any,
    ncMeta = Noco.ncMeta
  ): Promise<Storage[]> {
    if (!projectId) return null;
    let storageList =
      param.directory === null
        ? await NocoCache.getList(CacheScope.STORAGE, [projectId])
        : [];
    if (!storageList.length) {
      storageList = await ncMeta.metaList2(null, null, MetaTable.STORAGES, {
        condition: {
          project_id: projectId,
          ...(param.directory && { directory: param.directory }),
        },
      });
      if (param.directory === null) {
        await NocoCache.setList(CacheScope.STORAGE, [projectId], storageList);
      }
    }
    return storageList.map((s) => new Storage(s));
  }

  public static async update(storageId, storage, ncMeta = Noco.ncMeta) {
    // get existing cache
    const key = `${CacheScope.STORAGE}:${storageId}`;
    const updateObj = extractProps(storage, [
      'source',
      'title',
      'description',
      'directory',
      'url',
      'mimetype',
      'size',
      'meta',
    ]);
    let o = await NocoCache.get(key, CacheGetType.TYPE_OBJECT);
    if (o) {
      o = { ...o, ...updateObj };
      // set cache
      await NocoCache.set(key, o);
    }
    // set meta
    await ncMeta.metaUpdate(
      null,
      null,
      MetaTable.STORAGES,
      updateObj,
      storageId
    );
  }

  public static async delete(storageId: string, ncMeta = Noco.ncMeta) {
    await NocoCache.deepDel(
      CacheScope.STORAGE,
      `${CacheScope.STORAGE}:${storageId}`,
      CacheDelDirection.CHILD_TO_PARENT
    );
    await ncMeta.metaDelete(null, null, MetaTable.STORAGES, storageId);
  }

  public static async get(storageId: any, ncMeta = Noco.ncMeta) {
    let storageData =
      storageId &&
      (await NocoCache.get(
        `${CacheScope.STORAGE}:${storageId}`,
        CacheGetType.TYPE_OBJECT
      ));
    if (!storageData) {
      storageData = await ncMeta.metaGet2(
        null,
        null,
        MetaTable.STORAGES,
        storageId
      );
      await NocoCache.set(`${CacheScope.STORAGE}:${storageId}`, storageData);
    }
    return storageData && new Storage(storageData);
  }
}
