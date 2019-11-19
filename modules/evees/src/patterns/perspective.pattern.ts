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
  PatternAction,
  PatternRecognizer,
  CreateChild
} from '@uprtcl/cortex';
import { AccessControlService, Updatable, Secured } from '@uprtcl/common';
import { ReduxTypes, Logger } from '@uprtcl/micro-orchestrator';

import { Perspective, EveesTypes, Commit } from '../types';
import { Evees, NewPerspectiveArgs } from '../services/evees';
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
    CreateChild,
    Updatable {
  constructor(
    @inject(PatternTypes.Core.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(EveesTypes.Evees) protected evees: Evees,
    @inject(PatternTypes.Recognizer) protected recognizer: PatternRecognizer,
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
    const details = await this.evees.getPerspectiveDetails(perspective.id);
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
    args: NewPerspectiveArgs | undefined,
    providerName?: string
  ) => Promise<Secured<Perspective>> = async (
    args: NewPerspectiveArgs | undefined,
    providerName?: string
  ) => {
    return this.evees.createPerspective(args || {}, providerName);
  };

  getActions: (perspective: Secured<Perspective>) => PatternAction[] = (
    perspective: Secured<Perspective>
  ): PatternAction[] => {
    return [
      {
        icon: 'call_split',
        title: 'New perspective',
        action: async () => {
          const details = await this.evees.getPerspectiveDetails(perspective.id);
          const newPerspective = await this.create(
            { headId: details.headId, context: details.context },
            perspective.object.payload.origin
          );
          window.history.pushState('', '', `/?id=${newPerspective.id}`);
        }
      }
    ];
  };

  createChild = async (perspective: Secured<Perspective>, parent: any) => {
    const patterns: Pattern | Creatable<any, any> | HasLinks = this.recognizer.recognizeMerge(
      parent
    );

    const addChildrenLinks = (patterns as HasLinks).addChildrenLinks;

    if (patterns && (patterns as Creatable<any, any>).create && addChildrenLinks) {
      const newChildHashed = await (patterns as Creatable<any, any>).create(undefined);

      const childPerspective: Secured<Perspective> = await this.create(
        { dataId: newChildHashed.id },
        perspective.object.payload.origin
      );

      const entity = addChildrenLinks(parent, [childPerspective.id]);

      await this.update(perspective, entity);
    }
  };

  update: (perspective: Secured<Perspective>, newContent: any) => Promise<boolean> = async (
    perspective: Secured<Perspective>,
    newContent: any
  ) => {
    const details = await this.evees.getPerspectiveDetails(perspective.id);

    if (!details.headId)
      throw new Error('First commit must be made before being able to update the perspective');

    const previousHead: Secured<Commit> | undefined = await this.evees.get(details.headId);

    if (!previousHead)
      throw new Error('First commit must be made before being able to update the perspective');

    const knownSources = await this.evees.knownSources.getKnownSources(
      previousHead.object.payload.dataId
    );

    if (!knownSources)
      throw new Error('First commit must be made before being able to update the perspective');

    const data = await this.evees.createData(newContent, knownSources[0]);

    const newHead = await this.evees.createCommit(
      {
        dataId: data.id,
        message: `Commit at ${Date.now() / 1000}`,
        parentsIds: details.headId ? [details.headId] : []
      },
      perspective.object.payload.origin
    );

    await this.evees.updatePerspectiveDetails(perspective.id, { headId: newHead.id });

    const loadHead: LoadPerspectiveDetails = {
      type: LOAD_PERSPECTIVE_DETAILS,
      payload: {
        perspectiveId: perspective.id
      }
    };
    this.store.dispatch(loadHead);

    return true;
  };

  accessControl: (perspective: Secured<Perspective>) => AccessControlService<any> | undefined = (
    perspective: Secured<Perspective>
  ) => {
    return this.evees.getPerspectiveProvider(perspective).accessControl;
  };

  origin = (entity: Secured<Perspective>) => entity.object.payload.origin;
}
