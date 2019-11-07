import { injectable, inject } from 'inversify';
import {
  PatternTypes,
  HasRedirect,
  Pattern,
  IsSecure,
  HasLinks,
  Creatable,
  Signed,
  HasActions,
  PatternAction
} from '@uprtcl/cortex';
import { Perspective, UprtclTypes } from '../../types';

import { Uprtcl, NewPerspectiveArgs } from '../services/uprtcl';
import { Secured } from '../../patterns/default-secured.pattern';
import { Updatable } from '../../access-control/properties/updatable';
import { AccessControlService } from '../../access-control/services/access-control.service';

export const propertyOrder = ['origin', 'creatorId', 'timestamp'];

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

  recognize(object: object) {
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
    const details = await this.uprtcl.getPerspectiveDetails(perspective.id);
    return details.headId ? [details.headId] : [];
  };

  getLinks: (perspective: Secured<Perspective>) => Promise<string[]> = (
    perspective: Secured<Perspective>
  ) => this.getSoftLinks(perspective).then(links => links.concat(this.getHardLinks(perspective)));

  redirect: (perspective: Secured<Perspective>) => Promise<string | undefined> = async (
    perspective: Secured<Perspective>
  ) => {
    const details = await this.uprtcl.getPerspectiveDetails(perspective.id);
    return details.headId;
  };

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
          const details = await this.uprtcl.getPerspectiveDetails(perspective.id);
          const newPerspective = await this.create(
            { headId: details.headId, context: details.context },
            perspective.object.payload.origin
          );
          window.history.pushState('', '', `/?id=${newPerspective.id}`);
        }
      }
    ];
  };

  update: (perspective: Secured<Perspective>, newContent: any) => Promise<boolean> = async (
    perspective: Secured<Perspective>,
    newContent: any
  ) => {
    const data = await this.uprtcl.createData(newContent);

    const details = await this.uprtcl.getPerspectiveDetails(perspective.id);
    const newHead = await this.uprtcl.createCommit(
      {
        dataId: data.id,
        message: `Commit at ${Date.now() / 1000}`,
        parentsIds: details.headId ? [details.headId] : []
      },
      perspective.object.payload.origin
    );

    await this.uprtcl.updatePerspectiveDetails(perspective.id, { headId: newHead.id });

    return true;
  };

  accessControl: (perspective: Secured<Perspective>) => AccessControlService<any> | undefined = (
    perspective: Secured<Perspective>
  ) => {
    return this.uprtcl.getPerspectiveProvider(perspective).accessControl;
  };
}
