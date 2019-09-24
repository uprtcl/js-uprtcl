import {
  Pattern,
  Secured,
  RedirectPattern,
  PatternRegistry,
  Source,
  SecuredPattern,
  LinkedPattern,
  CreatePattern,
  Signed
} from '@uprtcl/cortex';
import { Commit } from '../types';
import { UprtclProvider } from '../services/uprtcl/uprtcl.provider';
import { PerspectivePattern } from './perspective.pattern';

export const propertyOrder = ['creatorId', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern
  implements
    Pattern,
    LinkedPattern<Secured<Commit>>,
    RedirectPattern<Secured<Commit>>,
    CreatePattern<
      { dataId: string; message: string; parentsIds: string[]; timestamp?: number },
      Signed<Commit>
    > {
  constructor(
    protected patternRegistry: PatternRegistry,
    protected securedPattern: Pattern & SecuredPattern<Secured<Commit>>,
    protected perspectivePattern: PerspectivePattern,
    protected source: Source,
    protected uprtcl: UprtclProvider
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

  create: (args: {
    dataId: string;
    message: string;
    parentsIds: string[];
    timestamp?: number;
  }) => Promise<Secured<Commit>> = async (args: {
    dataId: string;
    message: string;
    parentsIds: string[];
    timestamp?: number;
  }) => {
    args.timestamp = args.timestamp || Date.now();
    return await this.uprtcl.createCommit(
      args.dataId,
      args.parentsIds,
      args.message,
      args.timestamp
    );
  };
}
