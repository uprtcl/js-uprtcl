import { injectable, inject, multiInject } from 'inversify';

import {
  Pattern,
  HasLinks,
  Entity  
} from '@uprtcl/cortex';

import { Commit } from '../types';

export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern extends Pattern<Entity<Signed<Commit>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every(p => object.hasOwnProperty(p));
  }

  type = 'Commit';
}

@injectable()
export class CommitLinked implements HasLinks<Entity<Signed<Commit>>>, HasRedirect<Entity<Signed<Commit>>> {
  links: (commit: Entity<Signed<Commit>>) => Promise<string[]> = async (
    commit: Entity<Signed<Commit>>
  ): Promise<string[]> => [commit.entity.payload.dataId, ...commit.entity.payload.parentsIds];

  getChildrenLinks: (commit: Entity<Signed<Commit>>) => string[] = (
    commit: Entity<Signed<Commit>>
  ) => [] as string[];

  replaceChildrenLinks = (
    commit: Entity<Signed<Commit>>,
    newLinks: string[]
  ): Entity<Signed<Commit>> => commit;

  redirect: (commit: Entity<Signed<Commit>>) => Promise<string | undefined> = async (
    commit: Entity<Signed<Commit>>
  ) => commit.entity.payload.dataId;
}
