import { injectable, inject, multiInject } from 'inversify';
import { html, TemplateResult } from 'lit-element';

import {
  Pattern,
  HasRedirect,
  IsSecure,
  HasLinks,
  Creatable,
  Entity,
  Signed
} from '@uprtcl/cortex';
import { Secured } from '../patterns/default-secured.pattern';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Commit } from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from '../services/evees.remote';
import { DiscoveryModule, DiscoveryService, TaskQueue, Task } from '@uprtcl/multiplatform';

export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

@injectable()
export class CommitEntity implements Entity {
  constructor(
    @inject(EveesBindings.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>
  ) {}

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  name = 'Commit';
}

@injectable()
export class CommitLinked extends CommitEntity implements HasLinks, HasRedirect {
  links: (commit: Secured<Commit>) => Promise<string[]> = async (
    commit: Secured<Commit>
  ): Promise<string[]> => [commit.object.payload.dataId, ...commit.object.payload.parentsIds];

  getChildrenLinks: (commit: Secured<Commit>) => string[] = (commit: Secured<Commit>) =>
    [] as string[];

  replaceChildrenLinks = (commit: Secured<Commit>, newLinks: string[]): Secured<Commit> => commit;

  redirect: (commit: Secured<Commit>) => Promise<string | undefined> = async (
    commit: Secured<Commit>
  ) => commit.object.payload.dataId;
}

@injectable()
export class CommitLens extends CommitEntity implements HasLenses {
  constructor(
    @inject(EveesBindings.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>
  ) {
    super(securedPattern);
  }

  lenses: (commit: Secured<Commit>) => Lens[] = (commit: Secured<Commit>): Lens[] => {
    return [
      {
        name: 'evees:commit-history',
        type: 'version-control',
        render: (lensContent: TemplateResult) => html`
          <evees-commit-history .headId=${commit.id}>${lensContent}</evees-commit-history>
        `
      }
    ];
  };
}

@injectable()
export class CommitPattern extends CommitEntity
  implements
    Creatable<
      { dataId: string; message: string; creatorsIds: string[]; parentsIds: string[]; timestamp: number },
      Signed<Commit>
    > {
  constructor(
    @inject(EveesBindings.Secured)
    protected secured: Pattern & IsSecure<Secured<Commit>>,
    @multiInject(EveesBindings.EveesRemote) protected remotes: EveesRemote[],
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(DiscoveryModule.bindings.TaskQueue) protected taskQueue: TaskQueue
  ) {
    super(secured);
  }

  recognize(object: object) {
    return (
      this.secured.recognize(object) &&
      propertyOrder.every(p => this.secured.extract(object as Secured<Commit>).hasOwnProperty(p))
    );
  }

  create = () => async (
    args:
      | {
          dataId: string;
          message: string;
          creatorsIds: string[];
          parentsIds: string[];
          timestamp: number;
        }
      | undefined,
    source: string
  ) => {
    if (!args) throw new Error('Cannot create commit without specifying its details');

    const timestamp = args.timestamp;
    const creatorsIds = args.creatorsIds;

    const commitData: Commit = {
      creatorsIds: creatorsIds,
      dataId: args.dataId,
      message: args.message,
      timestamp: timestamp,
      parentsIds: args.parentsIds
    };

    const commit: Secured<Commit> = await this.secured.derive()(commitData);
    const remote: EveesRemote | undefined = this.remotes.find(r => r.source === source);

    if (!remote) throw new Error(`Source ${source} not registered`);

    await remote.cloneCommit(commit);

    await this.discovery.postEntityCreate(remote, commit);

    return commit;
  };

  computeId = () => async (
    args:
      | {
          dataId: string;
          message: string;
          creatorsIds: string[];
          parentsIds: string[];
          timestamp: number;
        }
      | undefined,
    source?: string
  ) => {
    if (!args) throw new Error('Cannot create commit without specifying its details');

    const timestamp = args.timestamp;
    const creatorsIds = args.creatorsIds;

    const commitData: Commit = {
      creatorsIds: creatorsIds,
      dataId: args.dataId,
      message: args.message,
      timestamp: timestamp,
      parentsIds: args.parentsIds
    };

    const commit: Secured<Commit> = await this.secured.derive()(commitData);

    return commit.id;
  };
}
