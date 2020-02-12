import { injectable, inject, multiInject } from 'inversify';
import { html, TemplateResult } from 'lit-element';

import {
  Pattern,
  HasRedirect,
  IsSecure,
  HasLinks,
  Creatable,
  Entity,
  Signed,
  Newable
} from '@uprtcl/cortex';
import { Secured } from '../patterns/default-secured.pattern';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Commit } from '../types';
import { EveesBindings } from '../bindings';
import { EveesRemote } from '../services/evees.remote';
import { DiscoveryModule, DiscoveryService } from '@uprtcl/multiplatform';
import { CREATE_COMMIT } from '../graphql/queries';
import { ApolloClientModule, ApolloClient } from '@uprtcl/graphql';
import { CreateCommitArgs } from 'src/services/evees';
import { CidConfig } from '@uprtcl/ipfs-provider';

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
  implements Creatable<Commit, Signed<Commit>>, Newable<Commit, Signed<Commit>> {
  constructor(
    @inject(EveesBindings.Secured)
    protected secured: Pattern & IsSecure<Secured<Commit>>,
    @multiInject(EveesBindings.EveesRemote) protected remotes: EveesRemote[],
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>
  ) {
    super(secured);
  }

  recognize(object: object) {
    return (
      this.secured.recognize(object) &&
      propertyOrder.every(p => this.secured.extract(object as Secured<Commit>).hasOwnProperty(p))
    );
  }

  create = () => async (args: CreateCommitArgs, source: string) => {
    args.timestamp = args.timestamp || Date.now();
    args.message = args.message || `Commit at ${Date.now()}`;
    args.parentsIds = args.parentsIds || [];

    const remote = this.remotes.find(r => r.source === source);
    if (remote === undefined) throw new Error(`remote ${source} not found`);
    if (!args.creatorsIds) {
      if (!remote || !remote.userId)
        throw new Error(
          'You must be signed in the evees remote you are trying to create the commit on or specify the creators ids'
        );

      args.creatorsIds = [remote.userId];
    }

    const commit = await this.new()(args as Commit, remote.hashRecipe);
    const result = await this.client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        ...args,
        source: source
      }
    });
    if (result.data.createCommit.id != commit.id)  {
      throw new Error('unexpected id');
    };
    return commit;
  };

  new = () => async (args: Commit, recipe: CidConfig) => {
    if (!args) throw new Error('Cannot create commit without specifying its details');

    const timestamp = args.timestamp || Date.now();
    const creatorsIds = args.creatorsIds;

    const commitData: Commit = {
      creatorsIds: creatorsIds,
      dataId: args.dataId,
      message: args.message,
      timestamp: timestamp,
      parentsIds: args.parentsIds
    };

    return this.secured.derive()(commitData, recipe);
  };
}
