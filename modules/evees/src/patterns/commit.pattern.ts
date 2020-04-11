import { injectable, inject, multiInject } from 'inversify';
import { html, TemplateResult } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import {
  Pattern,
  HasRedirect,
  IsSecure,
  HasLinks,
  Entity  
} from '@uprtcl/cortex';
import { CidConfig } from '@uprtcl/ipfs-provider';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Secured } from '../patterns/default-secured.pattern';
import { Commit } from '../types';
import { EveesBindings } from '../bindings';

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
