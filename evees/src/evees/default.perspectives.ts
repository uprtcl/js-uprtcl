import { Entity } from 'src/cas/interfaces/entity';
import { RemoteEvees } from './interfaces/remote.evees';
import { PartialPerspective, Perspective } from './interfaces/types';

export const snapDefaultPerspective = async (
  remote: RemoteEvees,
  perspective: PartialPerspective
): Promise<Entity<Perspective>> => {
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
  const meta = perspective.meta;

  const object: Perspective = {
    creatorId: creatorId,
    remote: remote.id,
    path,
    timestamp,
    context,
    meta,
  };

  const hash = await remote.store.hashEntity({ object, remote: remote.id });
  return {
    id: hash,
    object,
  };
};

export const getHome = async (
  remote: RemoteEvees,
  userId?: string
): Promise<Entity<Perspective>> => {
  const creatorId = userId === undefined ? 'root' : userId;
  const remoteHome: Perspective = {
    remote: remote.id,
    path: remote.defaultPath,
    creatorId,
    timestamp: 0,
    context: `${creatorId}.home`,
  };

  const hash = await remote.store.hashEntity({ object: remoteHome, remote: remote.id });
  return {
    id: hash,
    object: remoteHome,
  };
};
