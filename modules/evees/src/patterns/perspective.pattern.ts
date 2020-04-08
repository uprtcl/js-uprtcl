import { html } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { injectable, inject } from 'inversify';

import {
  HasRedirect,
  Pattern,
  HasLinks,
  Creatable,
  Entity,
  Signed,
  CortexModule,
  PatternRecognizer,
  Newable
} from '@uprtcl/cortex';
import { Updatable } from '@uprtcl/access-control';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CidConfig, DiscoveryModule, EntityCache } from '@uprtcl/multiplatform';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Perspective, PerspectiveDetails } from '../types';
import { EveesBindings } from '../bindings';
import { Evees, NewPerspectiveArgs, CreatePerspectiveArgs } from '../services/evees';
import { CREATE_PERSPECTIVE } from '../graphql/queries';
import { executeActions, cacheActions } from '../utils/actions';
import { extractSignedEntity } from './signed';
import { signAndHashObject } from './cid-hash';

export const propertyOrder = ['origin', 'creatorId', 'timestamp'];

export class PerspectivePattern extends Pattern<Entity<Signed<Perspective>>> {
  recognize(entity: object) {
    const object = extractSignedEntity(entity);

    return object && propertyOrder.every(p => object.hasOwnProperty(p));
  }

  type = 'Perspective';
}

@injectable()
export class PerspectiveLens implements HasLenses<Entity<Signed<Perspective>>> {
  lenses = (perspective: Entity<Signed<Perspective>>): Lens[] => {
    return [
      {
        name: 'evees:evee-perspective',
        type: 'evee',
        render: (context: any) => {
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

          return html`
            <evees-perspective
              perspective-id=${perspective.id}
              evee-color=${color}
              index=${index}
              .genealogy=${genealogy}
            >
            </evees-perspective>
          `;
        }
      }
    ];
  };
}

@injectable()
export class PerspectiveCreate
  implements
    Creatable<CreatePerspectiveArgs, Signed<Perspective>>,
    Newable<NewPerspectiveArgs, Signed<Perspective>> {
  constructor(
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(CortexModule.bindings.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @inject(DiscoveryModule.bindings.EntityCache) protected entityCache: EntityCache
  ) {}

  create = () => async (args: CreatePerspectiveArgs, authority: string) => {
    let fromDetails: PerspectiveDetails = (args as any).fromDetails;
    // TODO, review "if" logic. You might want to create a new perspective with details but without computing it.
    if (fromDetails || args.ofPerspectiveId) {
      fromDetails.context =
        fromDetails.context || `${Date.now()}.${Math.floor(Math.random() / 1000)}`;
      fromDetails.name = fromDetails.name || 'master';

      const result = await this.evees.computeNewGlobalPerspectiveOps(
        authority,
        fromDetails,
        args.ofPerspectiveId,
        args.canWrite,
        args.parentId
      );
      const actions = result[1];
      const perspective = result[0];

      await cacheActions(actions, this.entityCache, this.client);
      await executeActions(actions, this.client, this.patternRecognizer);

      return perspective;
    } else {
      const remote = this.evees.getAuthority(authority);

      const perspective = await this.new()((args as any).newPerspective, remote.cidConfig);
      const result = await this.client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          creatorId: perspective.entity.payload.creatorId,
          origin: perspective.entity.payload.origin,
          timestamp: perspective.entity.payload.timestamp,
          authority: perspective.entity.payload.origin,
          canWrite: args.canWrite || remote.userId,
          parentId: args.parentId
        }
      });

      return perspective;
    }
  };

  new = () => async (args: NewPerspectiveArgs, recipe: CidConfig) => {
    const userId = this.evees.getAuthority(args.autority).userId;

    if (!userId) throw new Error('Cannot create in an authority in which you are not signed in');

    const perspective: Perspective = {
      creatorId: userId,
      origin: args.autority,
      timestamp: args.timestamp || Date.now()
    };

    return signAndHashObject(perspective, recipe);
  };
}

@injectable()
export class PerspectiveLinks
  implements HasLinks<Entity<Signed<Perspective>>>, HasRedirect<Entity<Signed<Perspective>>> {
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
      }`
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
      }`
    });

    return result.data.entity.head ? result.data.entity.head.id : undefined;
  };
}

@injectable()
export class PerspectiveAccessControl implements Updatable<Entity<Signed<Perspective>>> {
  constructor(@inject(EveesBindings.Evees) protected evees: Evees) {}

  authority = (perspective: Entity<Signed<Perspective>>) =>
    this.evees.getPerspectiveProvider(perspective.entity);

  accessControl = (perspective: Entity<Signed<Perspective>>) => {
    const provider = this.evees.getPerspectiveProvider(perspective.entity);
    return provider.accessControl;
  };
}
