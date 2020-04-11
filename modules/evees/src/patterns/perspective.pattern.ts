import { html, TemplateResult } from 'lit-element';
import { ApolloClient, gql, from } from 'apollo-boost';
import { injectable, inject } from 'inversify';

import {
  HasRedirect,
  Pattern,
  IsSecure,
  HasLinks,
  Entity  
} from '@uprtcl/cortex';
import { Updatable } from '@uprtcl/access-control';
import { ApolloClientModule } from '@uprtcl/graphql';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Secured } from '../patterns/default-secured.pattern';
import { Perspective } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { Logger } from '@uprtcl/micro-orchestrator';

export const propertyOrder = ['authority', 'creatorId', 'timestamp'];

const logger = new Logger('PERSPECTIVE-ENTITY');

@injectable()
export class PerspectiveEntity implements Entity {
  constructor(@inject(EveesBindings.Secured) protected securedPattern: Pattern & IsSecure<any>) {}
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
    @inject(EveesBindings.Secured)
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
          const color: string = context ? (context.color ? context.color : undefined) : undefined;

          const index: number = context
            ? context.index !== undefined
              ? context.index
              : undefined
            : undefined;

          const genealogy: string[] = context
            ? context.genealogy !== undefined
              ? context.genealogy
              : []
            : [];

          // logger.log('lenses: evees:evee-perspective - render()', { perspective, lensContent, context });

          return html`
            <evees-perspective
              perspective-id=${perspective.id}
              evee-color=${color}
              index=${index}
              .genealogy=${genealogy}
              toggle-action=${context ? context.toggleAction : 'false'}
              .action=${context ? context.action : {}}
            >
            </evees-perspective>
          `;
        }
      }
    ];
  };
}

@injectable()
export class PerspectiveLinks extends PerspectiveEntity implements HasLinks, HasRedirect {
  constructor(
    @inject(EveesBindings.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>
  ) {
    super(securedPattern);
  }

  links = async (perspective: Secured<Perspective>) => {
    const result = await this.client.query({
      query: gql`{
        entity(id: "${perspective.id}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }
      }`
    });

    const headId = result.data.entity.head ? result.data.entity.head.id : undefined;

    return headId ? [headId] : [];
  };

  redirect = async (perspective: Secured<Perspective>) => {
    const result = await this.client.query({
      query: gql`{
        entity(id: "${perspective.id}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }
      }`
    });

    return result.data.entity.head ? result.data.entity.head.id : undefined;
  };
}

@injectable()
export class PerspectiveAccessControl extends PerspectiveEntity
  implements Updatable<Secured<Perspective>> {
  constructor(
    @inject(EveesBindings.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(EveesBindings.Evees) protected evees: Evees
  ) {
    super(securedPattern);
  }

  authority = (perspective: Secured<Perspective>) =>
    this.evees.getPerspectiveProvider(perspective.object);

  accessControl = (perspective: Secured<Perspective>) => {
    const provider = this.evees.getPerspectiveProvider(perspective.object);
    return provider.accessControl;
  };
}
