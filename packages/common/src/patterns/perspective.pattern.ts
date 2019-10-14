import { injectable, inject, multiInject, tagged } from 'inversify';
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
import { Perspective, UprtclTypes } from '../types';

import { UprtclProvider } from '../services/uprtcl.provider';
import { CommitPattern } from './commit.pattern';
import { UprtclMultiplatform } from '../services/uprtcl.multiplatform';
import { ContextPattern } from './context.pattern';

export const propertyOrder = ['origin', 'creatorId', 'timestamp', 'name'];

export interface PerspectiveArgs {
  name?: string;
  context?: string;
}

export type NewPerspectiveArgs =
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
    CreatePattern<NewPerspectiveArgs, Signed<Perspective>>,
    ActionsPattern,
    UpdatePattern {
  constructor(
    @inject(PatternTypes.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(PatternTypes.Core.Secured) protected securedPattern: Pattern & SecuredPattern<any>,
    @inject(UprtclTypes.UprtclMultiplatform) protected uprtclMultiplatform: UprtclMultiplatform,
    @inject(UprtclTypes.CommitPattern) protected commitPattern: CommitPattern,
    @inject(UprtclTypes.ContextPattern) protected contextPattern: ContextPattern
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
    const uprtcl = this.getProvider(perspective);

    const head = await uprtcl.getPerspectiveHead(perspective.id);
    const contextId = await uprtcl.getPerspectiveContext(perspective.id);
    return [head, contextId].filter(link => !!link) as string[];
  };

  getLinks: (perspective: Secured<Perspective>) => Promise<string[]> = (
    perspective: Secured<Perspective>
  ) => this.getSoftLinks(perspective).then(links => links.concat(this.getHardLinks(perspective)));

  redirect: (perspective: Secured<Perspective>) => Promise<string | undefined> = async (
    perspective: Secured<Perspective>
  ) => {
    const uprtcl = this.getProvider(perspective);
    return uprtcl.getPerspectiveHead(perspective.id);
  };

  getProvider(perspective: Secured<Perspective>): UprtclProvider {
    const perspectiveOrigin = perspective.object.payload.origin;

    const provider = this.uprtclMultiplatform.remote
      .getAllSources()
      .find(provider => provider.name === perspectiveOrigin);

    if (!provider)
      throw new Error(
        `Provider ${perspectiveOrigin} for perspective ${perspective.id} is not registered`
      );

    return provider;
  }

  create: (
    args: NewPerspectiveArgs,
    providerName?: string
  ) => Promise<Secured<Perspective>> = async (args: NewPerspectiveArgs, providerName?: string) => {
    const name = args.name || 'master';

    if (!providerName) {
      const sourcesNames = this.uprtclMultiplatform.remote.getAllSourcesNames();
      if (sourcesNames.length !== 1) {
        throw new Error(
          'Provider name cannot be empty, since we have more than one provider registered'
        );
      }

      providerName = sourcesNames[0];
    }

    const creator = (uprtcl: UprtclProvider) => uprtcl.createPerspective(name, Date.now());
    const cloner = (uprtcl: UprtclProvider, perspective: Secured<Perspective>) =>
      uprtcl.clonePerspective(perspective);

    const perspective: Secured<Perspective> = await this.uprtclMultiplatform.optimisticCreateIn(
      providerName,
      creator,
      cloner
    );

    // Set the perspective context
    let context = args.context || `${Date.now()}${Math.random()}`;

    const updater = (uprtcl: UprtclProvider) =>
      uprtcl.updatePerspectiveContext(perspective.id, context);
    await this.uprtclMultiplatform.optimisticUpdateIn(
      providerName,
      perspective,
      updater,
      updater,
      `Update context of ${perspective.id}`,
      perspective.id
    );

    let data = (args as { data: any }).data;
    let dataId = (args as { dataId: any }).dataId;
    let headId = (args as { headId: string }).headId;

    if (data) {
      const createdData = await this.createData(data);
      dataId = createdData.id;
    }

    if (dataId) {
      const head = await this.commitPattern.create(
        {
          dataId: dataId,
          message: `Commit at ${Date.now() / 1000}`,
          parentsIds: headId ? [headId] : []
        },
        providerName
      );
      headId = head.id;
    }

    // Set the perspective head if given
    if (headId) {
      const headUpdater = (uprtcl: UprtclProvider) =>
        uprtcl.updatePerspectiveHead(perspective.id, headId);

      await this.uprtclMultiplatform.optimisticUpdateIn(
        providerName,
        perspective,
        headUpdater,
        headUpdater,
        `Update head of ${perspective.id}`,
        perspective.id
      );
    }

    return perspective;
  };

  getActions: (perspective: Secured<Perspective>) => PatternAction[] = (
    perspective: Secured<Perspective>
  ): PatternAction[] => {
    const uprtcl = this.getProvider(perspective);
    return [
      {
        icon: 'call_split',
        title: 'New perspective',
        action: async () => {
          const [context, headId] = await Promise.all([
            uprtcl.getPerspectiveContext(perspective.id),
            uprtcl.getPerspectiveHead(perspective.id)
          ]);
          const newPerspective = await this.create({ headId, context }, uprtcl.name);
          window.location.href = `/?id=${newPerspective.id}`;
        }
      }
    ];
  };

  update: (perspective: Secured<Perspective>, newContent: any) => Promise<boolean> = async (
    perspective: Secured<Perspective>,
    newContent: any
  ) => {
    const uprtcl = this.getProvider(perspective);

    const data = await this.createData(newContent);

    const headId = await uprtcl.getPerspectiveHead(perspective.id);
    const newHead = await this.commitPattern.create(
      {
        dataId: data.id,
        message: `Commit at ${Date.now() / 1000}`,
        parentsIds: headId ? [headId] : []
      },
      uprtcl.name
    );

    // Careful!
    await uprtcl.updatePerspectiveHead(perspective.id, newHead.id);

    return true;
  };

  async createData<O extends object>(data: O): Promise<Hashed<O>> {
    const dataPattern: CreatePattern<O, any> = this.patternRecognizer.recognizeMerge(data);

    if (!dataPattern.create) throw new Error('Cannot create this type of data');

    return dataPattern.create(data);
  }
}
