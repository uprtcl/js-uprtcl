import { injectable, inject } from 'inversify';
import {
  Secured,
  PatternRecognizer,
  PatternTypes,
  RedirectPattern,
  Pattern,
  SecuredPattern,
  LinkedPattern,
  CreatePattern,
  Signed,
  ActionsPattern,
  PatternAction,
  UpdatePattern,
  Hashed
} from '@uprtcl/cortex';
import { Perspective, Commit, UprtclTypes } from '../types';

import { UprtclProvider } from '../services/uprtcl/uprtcl.provider';
import { CommitPattern } from './commit.pattern';

export const propertyOrder = ['origin', 'creatorId', 'timestamp', 'name'];

export interface PerspectiveArgs {
  name?: string;
  contextId?: string;
}

export type CreatePerspectiveArgs =
  | PerspectiveArgs
  | (PerspectiveArgs & { headId: string })
  | (PerspectiveArgs & { dataId: string })
  | (PerspectiveArgs & { data: any });

@injectable()
export class PerspectivePattern
  implements
    Pattern,
    LinkedPattern<Secured<Perspective>>,
    RedirectPattern<Secured<Perspective>>,
    CreatePattern<CreatePerspectiveArgs, Signed<Perspective>>,
    ActionsPattern,
    UpdatePattern {
  constructor(
    @inject(PatternTypes.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(PatternTypes.Core.Secured) protected securedPattern: Pattern & SecuredPattern<any>,
    @inject(UprtclTypes.UprtclProvider) protected uprtcl: UprtclProvider,
    @inject(UprtclTypes.CommitPattern) protected commitPattern: CommitPattern
  ) {}

  recognize(object: Object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Perspective>).hasOwnProperty(p)
      )
    );
  }

  getHardLinks: (perspective: Secured<Perspective>) => string[] = (
    perspective: Secured<Perspective>
  ): string[] => [];
  getSoftLinks: (perspective: Secured<Perspective>) => Promise<string[]> = async (
    perspective: Secured<Perspective>
  ) => {
    const head = await this.uprtcl.getPerspectiveHead(perspective.id);
    const contextId = await this.uprtcl.getPerspectiveContext(perspective.id);
    return [head, contextId].filter(link => !!link) as string[];
  };

  getLinks: (perspective: Secured<Perspective>) => Promise<string[]> = (
    perspective: Secured<Perspective>
  ) => this.getSoftLinks(perspective).then(links => links.concat(this.getHardLinks(perspective)));

  redirect: (perspective: Secured<Perspective>) => Promise<string | undefined> = async (
    perspective: Secured<Perspective>
  ) => this.uprtcl.getPerspectiveHead(perspective.id);

  create: (args: CreatePerspectiveArgs) => Promise<Secured<Perspective>> = async (
    args: CreatePerspectiveArgs
  ) => {
    args.name = args.name || 'master';
    const perspective: Secured<Perspective> = await this.uprtcl.createPerspective(
      args.name,
      Date.now()
    );

    // Set the perspective context
    if (!args.contextId) {
      const context = await this.uprtcl.createContext(Date.now(), 0);
      args.contextId = context.id;
    }
    await this.uprtcl.updatePerspectiveContext(perspective.id, args.contextId);

    let data = (args as { data: any }).data;
    let dataId = (args as { dataId: any }).dataId;
    let headId = (args as { headId: string }).headId;

    if (data) {
      const createdData = await this.createData(data);
      dataId = createdData.id;
    }

    if (dataId) {
      const head = await this.commitPattern.create({
        dataId: dataId,
        message: `Commit at ${Date.now() / 1000}`,
        parentsIds: headId ? [headId] : []
      });
      headId = head.id;
    }

    // Set the perspective head if given
    if (headId) await this.uprtcl.updatePerspectiveHead(perspective.id, headId);

    return perspective;
  };

  getActions: (object: Secured<Perspective>) => PatternAction[] = (
    object: Secured<Perspective>
  ): PatternAction[] => {
    return [
      {
        icon: 'call_split',
        title: 'New perspective',
        action: async () => {
          const [contextId, headId] = await Promise.all([
            this.uprtcl.getPerspectiveContext(object.id),
            this.uprtcl.getPerspectiveHead(object.id)
          ]);
          const perspective = await this.create({ headId, contextId });
          window.location.href = `/?id=${perspective.id}`;
        }
      }
    ];
  };

  update: (perspective: Secured<Perspective>, newContent: any) => Promise<boolean> = async (
    perspective: Secured<Perspective>,
    newContent: any
  ) => {
    const data = await this.createData(newContent);

    const headId = await this.uprtcl.getPerspectiveHead(perspective.id);
    const newHead = await this.commitPattern.create({
      dataId: data.id,
      message: `Commit at ${Date.now() / 1000}`,
      parentsIds: headId ? [headId] : []
    });

    await this.uprtcl.updatePerspectiveHead(perspective.id, newHead.id);

    return true;
  };

  async createData(data: any): Promise<Hashed<any>> {
    const dataPattern: CreatePattern<any, any> = this.patternRecognizer.recognizeMerge(data);

    if (!dataPattern.create) throw new Error('Cannot create this type of data');

    return dataPattern.create(data);
  }
}
