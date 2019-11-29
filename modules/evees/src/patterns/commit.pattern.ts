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
  PatternTypes
} from '@uprtcl/cortex';
import { Secured, DiscoveryTypes, DiscoveryService } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { Commit, EveesTypes } from '../types';
import { Evees } from '../services/evees';
import { Mergeable } from '../properties/mergeable';
import findMostRecentCommonAncestor from '../merge/common-ancestor';

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
    Mergeable,
    HasLenses {
  constructor(
    @inject(PatternTypes.Core.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Commit>>,
    @inject(EveesTypes.Evees) protected evees: Evees,
    @inject(DiscoveryTypes.DiscoveryService) protected discoveryService: DiscoveryService,
    @inject(PatternTypes.PatternRecognizer) protected recognizer: PatternRecognizer
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
        render: (lensContent: TemplateResult) => html`
          <commit-history .data=${commit}>${lensContent}</commit-history>
        `
      }
    ];
  };

  merge = async (toCommit: Secured<Commit>, fromCommit: Secured<Commit>) => {
    const commitsIds = [fromCommit.id, toCommit.id];
    const ancestorId = await findMostRecentCommonAncestor(this.discoveryService)(commitsIds);

    const ancestor: Secured<Commit> = await this.discoveryService.get(ancestorId);

    const ancestorData: any = await this.discoveryService.get(ancestor.object.payload.dataId);

    const fromData = await this.discoveryService.get(fromCommit.object.payload.dataId);
    const toData = await this.discoveryService.get(toCommit.object.payload.dataId);

    const pattern = this.recognizer.recognizeMerge(toCommit);

    if (!(pattern as Mergeable).merge)
      throw new Error('Trying to merge a data that cannot be merged');

    const newData = await (pattern as Mergeable).merge(toData, fromData, ancestorData);

    const toDataKnownSources = await this.evees.knownSources.getKnownSources(
      toCommit.object.payload.dataId
    );

    if (!toDataKnownSources) throw new Error('We do not know where to create the data');

    const newDataId = await this.evees.createData(newData, toDataKnownSources[0]);

    // TODO: filter out the parents that are already ancestors

    return this.create({
      dataId: newDataId,
      parentsIds: commitsIds,
      message: `Merge of ${fromCommit.id} to ${toCommit.id}`
    });
  };
}
