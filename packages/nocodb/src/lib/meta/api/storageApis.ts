import { Request, Response, Router } from 'express';
import { Tele } from 'nc-help';
import Storage from '../../models/Storage';
import { PagedResponseImpl } from '../helpers/PagedResponse';
import ncMetaAclMw from '../helpers/ncMetaAclMw';
import { StorageType } from 'nocodb-sdk';

export async function storageList(
  req: Request<any, StorageType>,
  res: Response
) {
  res.json(new PagedResponseImpl(await Storage.list(req.params.projectId)));
}

export async function storageCreate(
  req: Request<any, StorageType>,
  res: Response
) {
  Tele.emit('evt', { evt_type: 'storage:created' });
  res.json(await Storage.insert(req.body));
}

export async function storageDelete(
  req: Request<any, StorageType>,
  res: Response
) {
  Tele.emit('evt', { evt_type: 'storage:deleted' });
  res.json(await Storage.delete(req.params.storageId));
}

export async function storageRead(
  req: Request<any, StorageType>,
  res: Response
) {
  Tele.emit('evt', { evt_type: 'storage:read' });
  res.json(await Storage.get(req.params.storageId));
}

export async function StorageUpdate(
  req: Request<any, StorageType>,
  res: Response
) {
  Tele.emit('evt', { evt_type: 'storage:updated' });
  res.json(await Storage.update(req.params.storageId, req.body));
}

const router = Router({ mergeParams: true });

router.get(
  '/api/v1/db/meta/projects/:projectId/storages',
  ncMetaAclMw(storageList, 'storageList')
);

router.get(
  '/api/v1/db/meta/projects/:projectId/storages/:storageId',
  ncMetaAclMw(storageRead, 'storageRead')
);

router.post(
  '/api/v1/db/meta/projects/:projectId/storages',
  ncMetaAclMw(storageCreate, 'storageCreate')
);

router.patch(
  '/api/v1/db/meta/projects/:projectId/storages/:storageId',
  ncMetaAclMw(StorageUpdate, 'StorageUpdate')
);

router.delete(
  '/api/v1/db/meta/projects/:projectId/storages/:storageId',
  ncMetaAclMw(storageDelete, 'storageDelete')
);

export default router;
