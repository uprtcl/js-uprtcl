import { injectable, inject } from 'inversify';

import {
  CortexTypes,
  HasRedirect,
  Pattern,
  IsSecure,
  HasChildren,
  HasLinks,
  Creatable,
  Signed,
  HasActions,
  PatternAction,
  PatternRecognizer,
  Entity
} from '@uprtcl/cortex';
import { Secured } from '@uprtcl/common';

import { Perspective, EveesTypes, Commit } from '../types';
import { Evees, NewPerspectiveArgs } from '../services/evees';
import { MergeStrategy } from '../merge/merge-strategy';
import { createEntity } from '../utils/utils';

export const propertyOrder = ['origin', 'creatorId', 'timestamp'];

@injectable()
export class PerspectiveEntity implements Entity {
  constructor(
    @inject(CortexTypes.Core.Secured) protected securedPattern: Pattern & IsSecure<any>
  ) {}
  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Perspective>).hasOwnProperty(p)
      )
    );
  }

  name = 'Perspective';
}

@injectable()
export class PerspectiveLinks extends PerspectiveEntity
  implements HasLinks, HasRedirect, Creatable<NewPerspectiveArgs, Signed<Perspective>>, HasActions {
  constructor(
    @inject(CortexTypes.Core.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(EveesTypes.Evees) protected evees: Evees,
    @inject(CortexTypes.Recognizer) protected recognizer: PatternRecognizer,
    @inject(EveesTypes.MergeStrategy) protected merge: MergeStrategy
  ) {
    super(securedPattern);
  }

  links = async (perspective: Secured<Perspective>) => {
    const details = await this.evees.getPerspectiveDetails(perspective.id);
    return details.headId ? [details.headId] : [];
  };

  redirect = async (perspective: Secured<Perspective>) => {
    const details = await this.evees.getPerspectiveDetails(perspective.id);

    return details.headId;
  };

  create = () => async (args: NewPerspectiveArgs | undefined, providerName?: string) => {
    return this.evees.createPerspective(args || {}, providerName);
  };

  actions = (perspective: Secured<Perspective>): PatternAction[] => {
    return [
      {
        icon: 'call_split',
        title: 'New perspective',
        action: async () => {
          const details = await this.evees.getPerspectiveDetails(perspective.id);
          const newPerspective = await this.create()(
            { headId: details.headId, context: details.context },
            perspective.object.payload.origin
          );
          window.history.pushState('', '', `/?id=${newPerspective.id}`);
        },
        type: 'version_control'
      },
      {
        icon: 'merge_type',
        title: 'Merge',
        action: async () => {
          const updateRequests = await this.merge.mergePerspectives(
            perspective.id,
            'zb2rhcyLxU429tS4CoGYFbtskWPVE1ws6cByhYqjFTaTgivDe'
          );
          console.log(updateRequests);
        },
        type: 'version_control'
      }
    ];
  };

  createChild = (perspective: Secured<Perspective>) => async (parent: any) => {
    const creatable: Creatable<any, any> | undefined = this.recognizer.recognizeUniqueProperty(
      parent,
      prop => !!(prop as Creatable<any, any>).createChild
    );
    const childrenLinks: HasChildren | undefined = this.recognizer.recognizeUniqueProperty(
      parent,
      prop => !!(prop as HasChildren).createChild
    );

    if (creatable && childrenLinks) {
      const newChildHashed = await creatable.create()(undefined);

      const childPerspective: Secured<Perspective> = await this.create()(
        { dataId: newChildHashed.id },
        perspective.object.payload.origin
      );

      const previousLinks = childrenLinks.getChildrenLinks(parent);

      const entity = childrenLinks.replaceChildrenLinks(parent)([
        ...previousLinks,
        childPerspective.id
      ]);

      await this.update(perspective)(entity);
    }
  };

  update = (perspective: Secured<Perspective>) => async (newContent: any) => {
    const details = await this.evees.getPerspectiveDetails(perspective.id);

    if (!details.headId)
      throw new Error('First commit must be made before being able to update the perspective');

    const previousHead: Secured<Commit> | undefined = await this.evees.get(details.headId);

    if (!previousHead)
      throw new Error('First commit must be made before being able to update the perspective');

    const knownSources = await this.evees.knownSources.getKnownSources(
      previousHead.object.payload.dataId
    );

    const data = await createEntity(this.recognizer)(
      newContent,
      knownSources ? knownSources[0] : undefined
    );

    const newHead = await this.evees.createCommit(
      {
        dataId: data.id,
        message: `Commit at ${Date.now() / 1000}`,
        parentsIds: details.headId ? [details.headId] : []
      },
      perspective.object.payload.origin
    );

    await this.evees.updatePerspectiveDetails(perspective.id, { headId: newHead.id });

    return true;
  };

  accessControl = (perspective: Secured<Perspective>) => {
    return this.evees.getPerspectiveProvider(perspective).accessControl;
  };

  origin = (entity: Secured<Perspective>) => entity.object.payload.origin;
}
