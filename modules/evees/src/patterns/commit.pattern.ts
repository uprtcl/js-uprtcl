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
  PatternTypes,
  DiscoveryTypes,
  DiscoveryService
} from '@uprtcl/cortex';
import { Secured } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Commit, EveesTypes } from '../types';
import { Evees } from '../services/evees';
import { Mergeable } from '../properties/mergeable';

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
    @inject(EveesTypes.Evees) protected evees: Evees,
    @inject(DiscoveryTypes.DiscoveryService) protected discoveryService: DiscoveryService,
    @inject(PatternTypes.Recognizer) protected recognizer: PatternRecognizer
  ) {}

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  getLinks: (commit: Secured<Commit>) => Promise<string[]> = async (
    commit: Secured<Commit>
  ): Promise<string[]> => [commit.object.payload.dataId, ...commit.object.payload.parentsIds];

  getChildrenLinks: (commit: Secured<Commit>) => string[] = (commit: Secured<Commit>) =>
    [] as string[];

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
        render: (lensContent: TemplateResult) => html`
          <commit-history .data=${commit}>${lensContent}</commit-history>
        `
      }
    ];
  };
}
