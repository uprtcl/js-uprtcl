import { Secured } from '../cas/utils/cid-hash';
import { CidConfig, defaultCidConfig } from '../cas/interfaces/cid-config';
import { deriveSecured, signObject } from '../cas/utils/signed';
import { Signed } from '../patterns/interfaces/signable';

import { RemoteEvees } from './interfaces/remote.evees';
import { Commit, PartialPerspective, Perspective } from './interfaces/types';
import { CreateCommit } from './evees.service';

export const snapDefaultPerspective = async (
  remote: RemoteEvees,
  perspective: PartialPerspective
): Promise<Secured<Perspective>> => {
  const creatorId = perspective.creatorId
    ? perspective.creatorId
    : remote.userId
    ? remote.userId
    : '';
  const timestamp = perspective.timestamp !== undefined ? perspective.timestamp : Date.now();
  const path = perspective.path !== undefined ? perspective.path : remote.defaultPath;

  const defaultContext = await remote.store.hashEntity({
    object: {
      creatorId,
      timestamp,
    },
    remote: remote.id,
  });

  const context = perspective.context !== undefined ? perspective.context : defaultContext.id;

  const object: Perspective = {
    creatorId: creatorId,
    remote: remote.id,
    path,
    timestamp,
    context,
  };

  if (perspective.meta) {
    object.meta = perspective.meta;
  }

  const secured = {
    payload: object,
    proof: {
      signature: '',
      type: '',
    },
  };

  return remote.store.hashEntity({ object: secured, remote: remote.id });
};

export const getHome = async (
  remote: RemoteEvees,
  userId?: string
): Promise<Secured<Perspective>> => {
  const creatorId = userId === undefined ? (remote.userId ? remote.userId : '') : userId;

  const remoteHome: Perspective = {
    remote: remote.id,
    path: remote.defaultPath,
    creatorId,
    timestamp: 0,
    context: `${creatorId}.home`,
  };

  const secured = {
    payload: remoteHome,
    proof: {
      signature: '',
      type: '',
    },
  };

  return remote.store.hashEntity({ object: secured, remote: remote.id });
};

export const getConceptPerspective = async (
  concept: string,
  cidConfig: CidConfig = defaultCidConfig,
  casID: string = ''
): Promise<Secured<Perspective>> => {
  const perspective: Perspective = {
    remote: '',
    path: '',
    context: concept,
    creatorId: '',
    timestamp: 0,
  };

  return deriveSecured(perspective, cidConfig, casID);
};

export const createCommit = (commit: CreateCommit): Signed<Commit> => {
  const message = commit.message !== undefined ? commit.message : '';
  const timestamp = commit.timestamp !== undefined ? commit.timestamp : Date.now();
  const creatorsIds = commit.creatorsIds !== undefined ? commit.creatorsIds : [];
  const parentsIds = commit.parentsIds !== undefined ? commit.parentsIds : [];

  const commitData: Commit = {
    creatorsIds: creatorsIds,
    dataId: commit.dataId,
    message: message,
    timestamp: timestamp,
    parentsIds: parentsIds,
  };

  return signObject(commitData);
};
