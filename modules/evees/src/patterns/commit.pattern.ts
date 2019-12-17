import { injectable, inject } from 'inversify';
import { html, TemplateResult } from 'lit-element';

import {
  Pattern,
  HasRedirect,
  IsSecure,
  HasLinks,
  Creatable,
  Signed,
  PatternRecognizer,
  CortexTypes,
  DiscoveryTypes,
  DiscoveryService,
  Entity
} from '@uprtcl/cortex';
import { Secured } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Commit, EveesTypes } from '../types';
import { Evees } from '../services/evees';

export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

@injectable()
export class CommitEntity implements Entity {
  constructor(
    @inject(CortexTypes.Core.Secured)
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
  lenses: (commit: Secured<Commit>) => Lens[] = (commit: Secured<Commit>): Lens[] => {
    return [
      {
        name: 'commit-history',
        render: (lensContent: TemplateResult) => html`
          <commit-history .data=${commit}>${lensContent}</commit-history>
        `
      }
    ];
  };
}

@injectable()
export class CommitPattern extends CommitEntity
  implements
    Creatable<
      { dataId: string; message: string; parentsIds: string[]; timestamp?: number },
      Signed<Commit>
    > {
  constructor(
    @inject(CortexTypes.Core.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>,
    @inject(EveesTypes.Evees) protected evees: Evees
  ) {
    super(securedPattern);
  }

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  create = () => async (
    args:
      | {
          dataId: string;
          message: string;
          parentsIds: string[];
          timestamp?: number;
        }
      | undefined,
    providerName?: string
  ) => {
    if (!args) throw new Error('Cannot create commit without specifying its details');
    return this.evees.createCommit(args, providerName);
  };
}
