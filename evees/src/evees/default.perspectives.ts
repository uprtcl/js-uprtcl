import { Secured } from '../cas/utils/cid-hash';
import { RemoteEvees } from './interfaces/remote.evees';
import { PartialPerspective, Perspective } from './interfaces/types';

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

  const context = perspective.context !== undefined ? perspective.context : defaultContext;

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

  const hash = await remote.store.hashEntity({ object: secured, remote: remote.id });
  return {
    id: hash,
    object: secured,
  };
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

  const hash = await remote.store.hashEntity({ object: secured, remote: remote.id });
  return {
    id: hash,
    object: secured,
  };
};
