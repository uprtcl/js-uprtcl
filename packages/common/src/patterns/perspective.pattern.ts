import {
  Secured,
  PatternRegistry,
  RedirectPattern,
  Pattern,
  SecuredPattern,
  LinkedPattern,
  CreatePattern,
  Signed,
  Lens,
  ActionsPattern,
  LensesPattern,
  PatternAction,
  UpdatePattern,
  Hashed
} from '@uprtcl/cortex';
import { Perspective, Commit } from '../types';
import { UprtclProvider } from '../services/uprtcl/uprtcl.provider';

export const propertyOrder = ['origin', 'creatorId', 'timestamp', 'name'];

export class PerspectivePattern
  implements
    Pattern,
    LinkedPattern<Secured<Perspective>>,
    RedirectPattern<Secured<Perspective>>,
    CreatePattern<{ name?: string; contextId?: string }, Signed<Perspective>>,
    ActionsPattern,
    UpdatePattern {
  constructor(
    protected patternRegistry: PatternRegistry,
    protected securedPattern: Pattern & SecuredPattern<Secured<Perspective>>,
    protected uprtcl: UprtclProvider
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

  create: (args: {
    name?: string;
    contextId?: string;
    headId?: string;
  }) => Promise<Secured<Perspective>> = async (args: {
    name?: string;
    contextId?: string;
    headId?: string;
  }) => {
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

    // Set the perspective head if given
    if (args.headId) {
      await this.uprtcl.updatePerspectiveHead(perspective.id, args.headId);
    }

    return perspective;
  };

  getActions: (object: Secured<Perspective>) => PatternAction[] = (
    object: Secured<Perspective>
  ): PatternAction[] => {
    return [
      {
        icon: '',
        title: 'New perspective',
        action: async () => {
          const contextId = await this.uprtcl.getPerspectiveContext(object.id);
          const perspective = await this.create({ headId: object.id, contextId });
          window.location.href = `/?id=${perspective.id}`;
        }
      }
    ];
  };

  update: (perspective: Secured<Perspective>, newContent: any) => Promise<void> = async (
    perspective: Secured<Perspective>,
    newContent: any
  ) => {
    const dataPattern: CreatePattern<any, any> = this.patternRegistry.recognizeMerge(newContent);

    if (!dataPattern.create) throw new Error('Cannot create this type of data');

    const data: Hashed<any> = await dataPattern.create(newContent);

    const commitPattern: CreatePattern<
      { dataId: string; message: string; parentsIds: string[]; timestamp?: number },
      Signed<Commit>
    > = this.patternRegistry.getPattern('commit');

    const headId = await this.uprtcl.getPerspectiveHead(perspective.id);
    const newHead = await commitPattern.create({
      dataId: data.id,
      message: `Commit at ${Date.now() / 1000}`,
      parentsIds: headId ? [headId] : []
    });

    await this.uprtcl.updatePerspectiveHead(perspective.id, newHead.id);
  };
}
