import { injectable, inject, tagged, multiInject } from 'inversify';
import {
  Pattern,
  Secured,
  RedirectPattern,
  SecuredPattern,
  LinkedPattern,
  CreatePattern,
  LensesPattern,
  Lens,
  Signed,
  PatternTypes
} from '@uprtcl/cortex';
import { Commit, UprtclTypes } from '../types';
import { Uprtcl } from '../services/uprtcl';

export const propertyOrder = ['creatorId', 'timestamp', 'message', 'parentsIds', 'dataId'];

@injectable()
export class CommitPattern
  implements
    Pattern,
    LinkedPattern<Secured<Commit>>,
    RedirectPattern<Secured<Commit>>,
    CreatePattern<
      { dataId: string; message: string; parentsIds: string[]; timestamp?: number },
      Signed<Commit>
    >,
    LensesPattern {
  constructor(
    @inject(PatternTypes.Core.Secured)
    protected securedPattern: Pattern & SecuredPattern<Secured<Commit>>,
    @inject(UprtclTypes.Uprtcl) protected uprtcl: Uprtcl
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

  redirect: (commit: Secured<Commit>) => Promise<string> = async (commit: Secured<Commit>) =>
    commit.object.payload.dataId;

  create: (
    args: {
      dataId: string;
      message: string;
      parentsIds: string[];
      timestamp?: number;
    },
    providerName?: string
  ) => Promise<Secured<Commit>> = async (
    args: {
      dataId: string;
      message: string;
      parentsIds: string[];
      timestamp?: number;
    },
    providerName?: string
  ) => {
    return this.uprtcl.createCommit(args, providerName);
  };

  getLenses = (): Lens[] => {
    return [
      {
        lens: 'commit-history',
        params: {}
      }
    ];
  };
}
