import { ApolloClient, gql } from 'apollo-boost';
import { injectable, inject } from 'inversify';

import { Pattern, HasLinks, Entity, Signed } from '@uprtcl/cortex';
import { HasRedirect } from '@uprtcl/multiplatform';
import { Updatable } from '@uprtcl/access-control';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Perspective } from '../types';
import { EveesBindings } from '../bindings';
import { Evees } from '../services/evees';
import { extractSignedEntity } from '../utils/signed';

export const propertyOrder = ['authority', 'creatorId', 'timestamp'];

export class PerspectivePattern extends Pattern<Entity<Signed<Perspective>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = EveesBindings.PerspectiveType;
}

@injectable()
export class PerspectiveLinks implements HasLinks, HasRedirect {
  constructor(@inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>) {}

  links = async (perspective: Entity<Signed<Perspective>>) => {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${perspective.id}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }
      }`,
    });

    const headId = result.data.entity.head ? result.data.entity.head.id : undefined;

    return headId ? [headId] : [];
  };

  redirect = async (perspective: Entity<Signed<Perspective>>) => {
    const result = await this.client.query({
      query: gql`{
        entity(ref: "${perspective.id}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }
      }`,
    });

    return result.data.entity.head ? result.data.entity.head.id : undefined;
  };
}

@injectable()
export class PerspectiveAccessControl implements Updatable<Entity<Signed<Perspective>>> {
  constructor(@inject(EveesBindings.Evees) protected evees: Evees) {}

  authority = (perspective: Entity<Signed<Perspective>>) =>
    this.evees.getPerspectiveProvider(perspective.object);

  accessControl = (perspective: Entity<Signed<Perspective>>) => {
    const provider = this.evees.getPerspectiveProvider(perspective.object);
    return provider.accessControl;
  };
}
