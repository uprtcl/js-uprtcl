import { html, TemplateResult } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
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
  PatternRecognizer
} from '@uprtcl/cortex';
import { Updatable } from '@uprtcl/access-control';
import { ApolloClientModule } from '@uprtcl/graphql';
import { DiscoveryModule, DiscoveryService, createEntity } from '@uprtcl/multiplatform';
import { HasLenses, Lens } from '@uprtcl/lenses';

import { Secured } from '../patterns/default-secured.pattern';
import { Perspective, UprtclAction, CREATE_DATA_ACTION, CreateDataAction, CREATE_COMMIT_ACTION, CreateCommitAction, CREATE_AND_INIT_PERSPECTIVE, CreateAndInitPerspectiveAction } from '../types';
import { EveesBindings } from '../bindings';
import { Evees, NewPerspectiveArgs } from '../services/evees';
import { MergeStrategy } from '../merge/merge-strategy';
import { CREATE_COMMIT, CREATE_PERSPECTIVE } from 'src/graphql/queries';

export const propertyOrder = ['origin', 'creatorId', 'timestamp'];

@injectable()
export class PerspectiveEntity implements Entity {
  constructor(@inject(EveesBindings.Secured) protected securedPattern: Pattern & IsSecure<any>) { }
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
          const index: number = context ? (context.index !== undefined ? context.index : undefined) : undefined;
          const genealogy: string[] = context ? (context.genealogy !== undefined ? context.genealogy : []) : [];

          const onlyChildren: string = context
            ? context.onlyChildren !== undefined
              ? context.onlyChildren
              : 'false'
            : 'false';

          console.log('[PERSPECTIVE-PATTERN] render()', {
            perspective,
            context,
            onlyChildren,
            color
          });

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
  implements Creatable<NewPerspectiveArgs, Signed<Perspective>>, HasActions {
  constructor(
    @inject(EveesBindings.Secured) protected securedPattern: Pattern & IsSecure<any>,
    @inject(EveesBindings.Evees) protected evees: Evees,
    @inject(EveesBindings.MergeStrategy) protected merge: MergeStrategy,
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(CortexModule.bindings.Recognizer) protected patternRecognizer: PatternRecognizer,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>
  ) {
    super(securedPattern);
  }

  create = () => async (args: NewPerspectiveArgs, authority: string) => {
    const actions: UprtclAction<any>[] = [];
    const perspective = await this.evees.createPerspective(args, recursive, authority, canWrite, actions);

    const createDataPromises = actions
      .filter(a => a.type === CREATE_DATA_ACTION)
      .map(async (action: UprtclAction<CreateDataAction>) => {
        const dataId = await createEntity(this.patternRecognizer)(action.payload.data, action.payload.source);
        if (dataId !== action.id) {
          throw new Error(`created entity id ${dataId} not as expected ${action.id}`)
        }
    })

    await Promise.all(createDataPromises);

    const createCommitsPromises = actions
      .filter(a => a.type === CREATE_COMMIT_ACTION)
      .map(async (action: UprtclAction<CreateCommitAction>) => {
        const result = await this.client.mutate({
          mutation: CREATE_COMMIT,
          variables: {
            creatorsId:action.payload.commit.payload.creatorsIds,
            dataId: action.payload.commit.payload.dataId,
            message: action.payload.commit.payload.message,
            parentsIds: action.payload.commit.payload.parentsIds,
            timestamp: action.payload.commit.payload.timestamp,
            source: action.payload.source
          }
        });
        const headId = result.data.createCommit.id;
        if (headId !== action.id) {
          throw new Error(`created commit id ${headId} not as expected ${action.id}`)
        }
    })

    await Promise.all(createCommitsPromises);

    const createPerspectivesPromises = actions
      .filter(a => a.type === CREATE_AND_INIT_PERSPECTIVE)
      .map(async (action: UprtclAction<CreateAndInitPerspectiveAction>) => {
        const result = await this.client.mutate({
          mutation: CREATE_PERSPECTIVE,
          variables: {
            creatorId: action.payload.perspective.object.payload.creatorId,
            origin: action.payload.perspective.object.payload.origin,
            timestamp: action.payload.perspective.object.payload.timestamp,
            headId: action.payload.details.headId,
            context: action.payload.details.context,
            name: action.payload.details.name,
            authority: action.payload.perspective.object.payload.origin,
            canWrite: action.payload.owner
          }
        });
        const headId = result.data.createCommit.id;
        if (headId !== action.id) {
          throw new Error(`created commit id ${headId} not as expected ${action.id}`)
        }
    })

    await Promise.all(createPerspectivesPromises);

    return perspective;
  };

  computeId = () => async (args: NewPerspectiveArgs) => {
    const perspective: Secured<Perspective> = await this.securedPattern.derive()(args.perspective);

    return perspective.id;
  };

  actions = (perspective: Secured<Perspective>): PatternAction[] => {
    return [
      {
        icon: 'call_split',
        title: 'evees:new-perspective',
        action: async () => {
          const remote = this.evees.getPerspectiveProvider(perspective.object);
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
