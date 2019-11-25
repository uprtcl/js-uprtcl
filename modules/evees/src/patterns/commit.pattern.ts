import { injectable, inject } from 'inversify';
import { html } from 'lit-element';

import {
  Pattern,
  HasRedirect,
  IsSecure,
  HasLinks,
  Creatable,
  Signed,
  PatternTypes
} from '@uprtcl/cortex';
import { Secured } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Commit, EveesTypes } from '../types';
import { Evees } from '../services/evees';

export const propertyOrder = ['creatorsIds', 'timestamp', 'message', 'parentsIds', 'dataId'];

@injectable()
export class CommitPattern
  implements
    Pattern,
    HasLinks,
    HasRedirect,
    Creatable<
      { dataId: string; message: string; parentsIds: string[]; timestamp?: number },
      Signed<Commit>
    >,
    HasLenses {
  constructor(
    @inject(PatternTypes.Core.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>,
    @inject(EveesTypes.Evees) protected evees: Evees
  ) {}

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  getHardLinks: (commit: Secured<Commit>) => string[] = (commit: Secured<Commit>): string[] => [
    commit.object.payload.dataId,
    ...commit.object.payload.parentsIds
  ];
  getSoftLinks: (commit: Secured<Commit>) => Promise<string[]> = async (commit: Secured<Commit>) =>
    [] as string[];
  getLinks: (commit: Secured<Commit>) => Promise<string[]> = (commit: Secured<Commit>) =>
    this.getSoftLinks(commit).then(links => links.concat(this.getHardLinks(commit)));

  replaceChildrenLinks = (commit: Secured<Commit>, newLinks: string[]): Secured<Commit> => commit;

  redirect: (commit: Secured<Commit>) => string = (commit: Secured<Commit>) =>
    commit.object.payload.dataId;

  create: (
    args:
      | {
          dataId: string;
          message: string;
          parentsIds: string[];
          timestamp?: number;
        }
      | undefined,
    providerName?: string
  ) => Promise<Secured<Commit>> = async (
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

  getLenses: (commit: Secured<Commit>) => Lens[] = (commit: Secured<Commit>): Lens[] => {
    return [
      {
        name: 'commit-history',
        render: html`
          <commit-history .data=${commit}></commit-history>
        `
      }
    ];
  };
}
