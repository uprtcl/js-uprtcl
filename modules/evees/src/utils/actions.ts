import { ApolloClient } from 'apollo-boost';

import { createEntity, EntityCache } from '@uprtcl/multiplatform';
import { PatternRecognizer } from '@uprtcl/cortex';

import { CREATE_COMMIT, CREATE_PERSPECTIVE } from '../graphql/queries';
import {
  UprtclAction,
  CREATE_DATA_ACTION,
  CREATE_COMMIT_ACTION,
  CREATE_AND_INIT_PERSPECTIVE_ACTION
} from '../types';

export async function executeActions(
  actions: UprtclAction[],
  client: ApolloClient<any>,
  entityCache: EntityCache,
  recognizer: PatternRecognizer
): Promise<void> {
  /** optimistic pre-fill the cache */
  const updateCachePromises = actions.map(action => {
    if (action.entity) {
      return entityCache.cacheEntity(action.entity);
    }
  });

  await Promise.all(updateCachePromises);
  const createDataPromises = actions
    .filter(a => a.type === CREATE_DATA_ACTION)
    .map(async (action: UprtclAction) => {
      if (!action.entity) throw new Error('entity undefined');

      const dataId = await createEntity(recognizer)(action.entity.object, action.payload.source);
      if (dataId !== action.entity.id) {
        throw new Error(`created entity id ${dataId} not as expected ${action.entity.id}`);
      }
    });

  await Promise.all(createDataPromises);

  const createCommitsPromises = actions
    .filter(a => a.type === CREATE_COMMIT_ACTION)
    .map(async (action: UprtclAction) => {
      if (!action.entity) throw new Error('entity undefined');
      const result = await client.mutate({
        mutation: CREATE_COMMIT,
        variables: {
          ...action.entity.object.payload,
          source: action.payload.source
        }
      });
      const headId = result.data.createCommit.id;
      if (headId !== action.entity.id) {
        throw new Error(`created commit id ${headId} not as expected ${action.entity.id}`);
      }
    });

  await Promise.all(createCommitsPromises);

  const createPerspectivesPromises = actions
    .filter(a => a.type === CREATE_AND_INIT_PERSPECTIVE_ACTION)
    .map(async (action: UprtclAction) => {
      if (!action.entity) throw new Error('entity undefined');
      const result = await client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          ...action.entity.object.payload,
          ...action.payload.details,
          authority: action.entity.object.payload.origin,
          canWrite: action.payload.owner
        }
      });
      if (result.data.createPerspective.id !== action.entity.id) {
        throw new Error(
          `created commit id ${result.data.createPerspective.id} not as expected ${action.entity.id}`
        );
      }
    });

  await Promise.all(createPerspectivesPromises);
}
