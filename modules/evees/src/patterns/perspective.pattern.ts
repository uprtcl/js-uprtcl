import { html, TemplateResult } from 'lit-element';
import { ApolloClient, gql, from } from 'apollo-boost';
import { injectable, inject } from 'inversify';

import {
  HasRedirect,
  Pattern,
  IsSecure,
  HasLinks,
  Creatable,
  HasActions,
  PatternAction,
  Entity,
  Signed,
  CortexModule,
  PatternRecognizer,
  Newable,
  Hashed
} from '@uprtcl/cortex';
import { Updatable } from '@uprtcl/access-control';
import { CidConfig } from '@uprtcl/ipfs-provider';
import { ApolloClientModule } from '@uprtcl/graphql';
import {
  DiscoveryModule,
  DiscoveryService,
  createEntity,
  EntityCache
} from '@uprtcl/multiplatform';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Secured } from '../patterns/default-secured.pattern';
import { Perspective, PerspectiveDetails } from '../types';
import { EveesBindings } from '../bindings';
import { Evees, NewPerspectiveArgs, CreatePerspectiveArgs } from '../services/evees';
import { MergeStrategy } from '../merge/merge-strategy';
import { CREATE_PERSPECTIVE } from '../graphql/queries';
import { executeActions, cacheActions } from 'src/utils/actions';

export const propertyOrder = ['origin', 'creatorId', 'timestamp'];

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

          const level: number = context ? (context.level !== undefined ? context.level : 1) : 1;
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

          const onlyChildren: string = context
            ? context.onlyChildren !== undefined
              ? context.onlyChildren
              : 'false'
            : 'false';

          return html`
            <evees-perspective
              perspective-id=${perspective.id}
              evee-color=${color}
              only-children=${onlyChildren}
              level=${level}
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
export class PerspectiveCreate extends PerspectiveEntity
  implements
    Creatable<CreatePerspectiveArgs, Signed<Perspective>>,
    Newable<NewPerspectiveArgs, Signed<Perspective>>,
    HasActions {
  constructor(
    @inject(EveesBindings.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(EveesBindings.MergeStrategy) protected merge: MergeStrategy,
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(CortexModule.bindings.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @inject(DiscoveryModule.bindings.EntityCache) protected entityCache: EntityCache
  ) {
    super(securedPattern);
  }

  create = () => async (args: CreatePerspectiveArgs, authority: string) => {
    let fromDetails: PerspectiveDetails = (args as any).fromDetails;
    if (fromDetails) {
      fromDetails.context =
        fromDetails.context || `${Date.now()}.${Math.floor(Math.random() / 1000)}`;
      fromDetails.name = fromDetails.name || 'master';

      const result = await this.evees.computeNewGlobalPerspectiveOps(
        authority,
        fromDetails,
        args.canWrite
      );
      const actions = result[1];
      const perspective = result[0];

      await cacheActions(actions, this.entityCache, this.client);
      await executeActions(actions, this.client, this.patternRecognizer);

      return perspective;
    } else {
      const remote = this.evees.getAuthority(authority);

      const perspective = await this.new()((args as any).newPerspective, remote.hashRecipe);
      const result = await this.client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          creatorId: perspective.object.payload.creatorId,
          origin: perspective.object.payload.origin,
          timestamp: perspective.object.payload.timestamp,
          authority: perspective.object.payload.origin,
          canWrite: args.canWrite || remote.userId
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

    return this.securedPattern.derive()(perspective, recipe);
  };

  actions = (perspective: Secured<Perspective>): PatternAction[] => {
    return [];
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
