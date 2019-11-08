import { injectable, inject } from 'inversify';
import { Store } from 'redux';

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
import { AccessControlService, Updatable, Secured } from '@uprtcl/common';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';

import { Perspective, UprtclTypes } from '../types';
import { Uprtcl, NewPerspectiveArgs } from '../services/uprtcl';
import { selectPerspectiveHeadId, selectEvees } from '../state/evees.selectors';
import { LoadPerspectiveDetails, LOAD_PERSPECTIVE_DETAILS } from '../state/evees.actions';

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
    @inject(UprtclTypes.Uprtcl) protected uprtcl: Uprtcl,
    @inject(ReduxTypes.Store) protected store: Store
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

  redirect: (perspective: Secured<Perspective>) => string | undefined = (
    perspective: Secured<Perspective>
  ) => {
    const state = this.store.getState();

    const headId = selectPerspectiveHeadId(perspective.id)(selectEvees(state));

    return headId;
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

  update: (perspective: Secured<Perspective>, newContent: any) => Promise<void> = async (
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

    const loadHead: LoadPerspectiveDetails = {
      type: LOAD_PERSPECTIVE_DETAILS,
      payload: {
        perspectiveId: perspective.id
      }
    };
    this.store.dispatch(loadHead);
  };

  accessControl: (perspective: Secured<Perspective>) => AccessControlService<any> | undefined = (
    perspective: Secured<Perspective>
  ) => {
    return this.uprtcl.getPerspectiveProvider(perspective).accessControl;
  };
}
