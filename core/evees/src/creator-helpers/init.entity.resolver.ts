import { EntityRemoteLocal, RouterEntityResolver, EntityResolverBase } from '../evees/clients';
import { ClientRemote, EntityRemote } from '../evees/interfaces';

/** Builds an entity resolver using the entity remotes from an array of ClientRemotes, and
 * stacks a EntityRouter to connect the them. */
export const initEntityResolver = (clientRemotes: ClientRemote[]) => {
  const clientToEntityRemotesMap = new Map<string, string>();
  clientRemotes.forEach((remote) => {
    clientToEntityRemotesMap.set(remote.id, remote.entityRemote.id);
  });

  /** extract all unique entity remotes */
  const entitiesRemotesMap = new Map<string, EntityRemote>();
  clientRemotes.forEach((remote) =>
    entitiesRemotesMap.set(remote.entityRemote.id, remote.entityRemote)
  );

  const entityRemotes = Array.from(entitiesRemotesMap.values());
  const entityRemoteLocal = new EntityRemoteLocal();
  entityRemotes.push(entityRemoteLocal);

  const entityRouter = new RouterEntityResolver(entityRemotes, clientToEntityRemotesMap);
  return new EntityResolverBase(entityRouter);
};
