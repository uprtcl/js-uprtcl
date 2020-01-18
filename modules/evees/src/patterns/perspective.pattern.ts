import { html, TemplateResult } from 'lit-element';
import { ApolloClient } from 'apollo-boost';
import { injectable, inject } from 'inversify';

import {
  HasRedirect,
  Pattern,
  IsSecure,
  HasLinks,
  Creatable,
  HasActions,
  PatternAction,
  PatternRecognizer,
  Entity,
  CortexModule
} from '@uprtcl/cortex';
import { Secured, CorePatterns, ApolloClientModule } from '@uprtcl/common';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Perspective } from '../types';
import { EveesBindings } from '../bindings';
import { Evees, NewPerspectiveArgs } from '../services/evees';
import { MergeStrategy } from '../merge/merge-strategy';

export const propertyOrder = ['origin', 'creatorId', 'timestamp'];

@injectable()
export class PerspectiveEntity implements Entity {
  constructor(@inject(CorePatterns.Secured) protected securedPattern: Pattern & IsSecure<any>) {}
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
export class PerspectiveLens extends PerspectiveEntity implements HasLenses {
  constructor(
    @inject(CorePatterns.Secured)
    protected securedPattern: Pattern & IsSecure<Secured<Perspective>>
  ) {
    super(securedPattern);
  }

  lenses = (perspective: Secured<Perspective>): Lens[] => {
    return [
      {
        name: 'evees:evee-perspective',
        type: 'evee',
        render: (lensContent: TemplateResult, context: any) => {
          const color = context ? (context.color ? context.color : undefined) : undefined;
          return html`
            <evees-perspective perspective-id=${perspective.id} evee-color=${color}>
            </evees-perspective>
          `;
        }
      }
    ];
  };
}

@injectable()
export class PerspectiveLinks extends PerspectiveEntity
  implements HasLinks, HasRedirect, Creatable<NewPerspectiveArgs>, HasActions {
  constructor(
    @inject(CorePatterns.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer,
    @inject(EveesBindings.MergeStrategy) protected merge: MergeStrategy,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>
  ) {
    super(securedPattern);
  }

  links = async (perspective: Secured<Perspective>) => {
    const remote = this.evees.getPerspectiveProvider(perspective);
    const details = await remote.getPerspectiveDetails(perspective.id);
    return details.headId ? [details.headId] : [];
  };

  redirect = async (perspective: Secured<Perspective>) => {
    const remote = this.evees.getPerspectiveProvider(perspective);
    const details = await remote.getPerspectiveDetails(perspective.id);

    return details.headId;
  };

  create = () => async (args: NewPerspectiveArgs | undefined, providerName?: string) => {
    const { id } = await this.evees.createPerspective(args || {}, providerName);
    return id;
  };

  actions = (perspective: Secured<Perspective>): PatternAction[] => {
    return [
      {
        icon: 'call_split',
        title: 'evees:new-perspective',
        action: async () => {
          const remote = this.evees.getPerspectiveProvider(perspective);
          const details = await remote.getPerspectiveDetails(perspective.id);

          const newPerspectiveId = await this.create()(
            { headId: details.headId, context: details.context },
            perspective.object.payload.origin
          );
          window.history.pushState('', '', `/?id=${newPerspectiveId}`);
        },
        type: 'version-control'
      },
      {
        icon: 'merge_type',
        title: 'evees:merge',
        action: async () => {
          const updateRequests = await this.merge.mergePerspectives(
            perspective.id,
            'zb2rhcyLxU429tS4CoGYFbtskWPVE1ws6cByhYqjFTaTgivDe'
          );
          console.log(updateRequests);
        },
        type: 'version-control'
      }
    ];
  };
}
