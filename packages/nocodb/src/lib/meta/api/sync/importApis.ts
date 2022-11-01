import { Request, Router } from 'express';
// import { Queue } from 'bullmq';
// import axios from 'axios';
import catchError from '../../helpers/catchError';
import { Server } from 'socket.io';
import NocoJobs from '../../../jobs/NocoJobs';
import job, { AirtableSyncConfig } from './helpers/job';
import SyncSource from '../../../models/SyncSource';
import Noco from '../../../Noco';
import { genJwt } from '../userApi/helpers';
import { NcError } from '../../helpers/catchError';

const AIRTABLE_IMPORT_JOB = 'AIRTABLE_IMPORT_JOB';
const AIRTABLE_PROGRESS_JOB = 'AIRTABLE_PROGRESS_JOB';

enum SyncStatus {
  PROGRESS = 'PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export default (router: Router, sv: Server) => {
  // add importer job handler and progress notification job handler
  NocoJobs.jobsMgr.addJobWorker(AIRTABLE_IMPORT_JOB, job);
  NocoJobs.jobsMgr.addJobWorker(
    AIRTABLE_PROGRESS_JOB,
    ({ payload, progress }) => {
      sv.to(payload?.id).emit('progress', {
        msg: progress?.msg,
        level: progress?.level,
        status: progress?.status,
      });
    }
  );

  NocoJobs.jobsMgr.addProgressCbk(AIRTABLE_IMPORT_JOB, (payload, progress) => {
    NocoJobs.jobsMgr.add(AIRTABLE_PROGRESS_JOB, {
      payload,
      progress: {
        msg: progress?.msg,
        level: progress?.level,
        status: progress?.status,
      },
    });
  });
  NocoJobs.jobsMgr.addSuccessCbk(AIRTABLE_IMPORT_JOB, (payload) => {
    NocoJobs.jobsMgr.add(AIRTABLE_PROGRESS_JOB, {
      payload,
      progress: {
        msg: 'Complete!',
        status: SyncStatus.COMPLETED,
      },
    });
  });
  NocoJobs.jobsMgr.addFailureCbk(AIRTABLE_IMPORT_JOB, (payload, error: any) => {
    NocoJobs.jobsMgr.add(AIRTABLE_PROGRESS_JOB, {
      payload,
      progress: {
        msg: error?.message || 'Failed due to some internal error',
        status: SyncStatus.FAILED,
      },
    });
  });

  router.post(
    '/api/v1/db/meta/import/airtable',
    catchError((req, res) => {
      NocoJobs.jobsMgr.add(AIRTABLE_IMPORT_JOB, {
        id: req.query.id,
        ...req.body,
      });
      res.json({});
    })
  );
  router.post(
    '/api/v1/db/meta/syncs/:syncId/trigger',
    catchError(async (req: Request, res) => {
      const syncSource = await SyncSource.get(req.params.syncId);

      if (!syncSource) {
        NcError.badRequest('Sync source not found!');
      }

      if (syncSource.enabled === false) {
        NcError.badRequest('Sync is already triggered!');
      }

      const user = await syncSource.getUser();
      const token = genJwt(user, Noco.getConfig());

      // Treat default baseUrl as siteUrl from req object
      let baseURL = (req as any).ncSiteUrl;

      // if environment value avail use it
      // or if it's docker construct using `PORT`
      if (process.env.NC_BASEURL_INTERNAL) {
        baseURL = process.env.NC_BASEURL_INTERNAL;
      } else if (process.env.NC_DOCKER) {
        baseURL = `http://localhost:${process.env.PORT || 8080}`;
      }

      await SyncSource.update(req.params.syncId, { enabled: false });

      NocoJobs.jobsMgr.add<AirtableSyncConfig>(AIRTABLE_IMPORT_JOB, {
        id: req.params.syncId,
        ...(syncSource?.details || {}),
        projectId: syncSource.project_id,
        authToken: token,
        baseURL,
      });

      res.json({});
    })
  );

  router.post(
    '/api/v1/db/meta/syncs/:syncId/abort',
    catchError(async (req: Request, res) => {
      const syncSource = await SyncSource.get(req.params.syncId);
      
      if (syncSource.enabled === true) {
        NcError.badRequest('Sync is not triggered!');
      }

      await SyncSource.update(req.params.syncId, { enabled: true });

      res.json({});
    })
  );
};
