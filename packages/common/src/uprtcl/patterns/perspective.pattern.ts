import { injectable, inject } from 'inversify';
import {
  Secured,
  PatternTypes,
  HasRedirect,
  Pattern,
  IsSecure,
  HasLinks,
  Creatable,
  Signed,
  HasActions,
  Updatable,
  PatternAction
} from '@uprtcl/cortex';
import { Perspective, UprtclTypes } from '../../types';

import { Uprtcl, NewPerspectiveArgs } from '../services/uprtcl';

export const propertyOrder = ['origin', 'creatorId', 'timestamp', 'name'];

@injectable()
export class PerspectivePattern
  implements
    Pattern,
    HasLinks,
    HasRedirect,
    Creatable<NewPerspectiveArgs, Signed<Perspective>>,
    HasActions,
    Updatable {
  constructor(
    @inject(PatternTypes.Core.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(UprtclTypes.Uprtcl) protected uprtcl: Uprtcl
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
    return head ? [head] : [];
  };

  getLinks: (perspective: Secured<Perspective>) => Promise<string[]> = (
    perspective: Secured<Perspective>
  ) => this.getSoftLinks(perspective).then(links => links.concat(this.getHardLinks(perspective)));

  redirect: (perspective: Secured<Perspective>) => Promise<string | undefined> = async (
    perspective: Secured<Perspective>
  ) => this.uprtcl.getPerspectiveHead(perspective.id);

  create: (
    args: NewPerspectiveArgs,
    providerName?: string
  ) => Promise<Secured<Perspective>> = async (args: NewPerspectiveArgs, providerName?: string) => {
    return this.uprtcl.createPerspective(args, providerName);
  };

  getActions: (perspective: Secured<Perspective>) => PatternAction[] = (
    perspective: Secured<Perspective>
  ): PatternAction[] => {
    return [
      {
        icon: 'call_split',
        title: 'New perspective',
        action: async () => {
          const [context, headId] = await Promise.all([
            this.uprtcl.getPerspectiveContext(perspective.id),
            this.uprtcl.getPerspectiveHead(perspective.id)
          ]);
          const newPerspective = await this.create(
            { headId, context },
            perspective.object.payload.origin
          );
          window.location.href = `/?id=${newPerspective.id}`;
        }
      }
    ];
  };

  update: (perspective: Secured<Perspective>, newContent: any) => Promise<boolean> = async (
    perspective: Secured<Perspective>,
    newContent: any
  ) => {
    const data = await this.uprtcl.createData(newContent);

    const headId = await this.uprtcl.getPerspectiveHead(perspective.id);
    const newHead = await this.uprtcl.createCommit(
      {
        dataId: data.id,
        message: `Commit at ${Date.now() / 1000}`,
        parentsIds: headId ? [headId] : []
      },
      perspective.object.payload.origin
    );

    await this.uprtcl.updatePerspectiveHead(perspective.id, newHead.id);

    return true;
  };
}
