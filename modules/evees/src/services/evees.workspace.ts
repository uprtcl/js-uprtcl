import { ApolloClient, ApolloLink, gql } from 'apollo-boost';
import Observable from 'zen-observable-ts';
import cloneDeep from 'lodash-es/cloneDeep';
import { CREATE_ENTITY, CREATE_PERSPECTIVE } from '../graphql/queries';
import { Entity, PatternRecognizer } from '@uprtcl/cortex';
import { UpdateRequest, NewPerspectiveData } from '../types';
import { EveesHelpers } from '../graphql/helpers';

export class EveesWorkspace {
  private entities: Entity<any>[] = [];
  private newPerspectives: NewPerspectiveData[] = [];
  private updates: UpdateRequest[] = [];

  public workspace: ApolloClient<any>;

  constructor(client: ApolloClient<any>, protected recognizer?: PatternRecognizer) {
    this.workspace = this.buildWorkspace(client);
  }

  private buildWorkspace(client: ApolloClient<any>): ApolloClient<any> {
    const link = new ApolloLink((operation, forward) => {
      return new Observable((observer) => {
        client
          .query({
            query: operation.query,
            variables: operation.variables,
            context: operation.getContext(),
          })
          .then((result) => {
            observer.next(result);
            observer.complete();
          })
          .catch((error) => {
            observer.error(error);
            observer.complete();
          });

        return () => {};
      });
    });

    const workspace = new ApolloClient<any>({
      cache: cloneDeep(client.cache),
      typeDefs: client.typeDefs,
      link: link,
    });

    return workspace;
  }

  public hasUpdates() {
    return this.updates.length > 0;
  }

  public async isSingleAuthority(authority: string) {
    const newNot = this.newPerspectives.find(
      (newPerspective) => newPerspective.perspective.object.payload.authority !== authority
    );
    if (newNot !== undefined) return false;

    const check = this.updates.map(async (update) =>
      EveesHelpers.getPerspectiveAuthority(this.workspace, update.perspectiveId)
    );
    const checktoPerspectives = await Promise.all(check);

    const updateNot = checktoPerspectives.find((_authority) => _authority !== authority);
    if (updateNot !== undefined) return false;

    return true;
  }

  public getUpdates() {
    return this.updates;
  }

  public getEntities() {
    return this.entities;
  }

  public getNewPerspectives() {
    return this.newPerspectives;
  }

  public create(entity: Entity<any>) {
    this.entities.push(entity);
    this.cacheCreateEntity(entity);
  }

  public newPerspective(perspective: NewPerspectiveData) {
    this.newPerspectives.push(perspective);
    this.cacheInitPerspective(perspective);
  }

  public update(update: UpdateRequest) {
    this.updates.push(update);
    this.cacheUpdateHead(update);
  }

  private cacheCreateEntity(entity: Entity<any>) {
    if (!this.recognizer) throw new Error('recognized not provided');

    const type = this.recognizer.recognizeType(entity);

    this.workspace.writeQuery({
      query: gql`{
        entity(ref: "${entity.id}") {
          __typename
          id
          _context {
            object
            casID
          }
        }
      }`,

      data: {
        entity: {
          __typename: type,
          id: entity.id,
          _context: {
            __typename: 'EntityContext',
            object: entity.object,
            casID: entity.casID,
          },
        },
      },
    });
  }

  private cacheInitPerspective(newPerspective: NewPerspectiveData) {
    const perspectiveId = newPerspective.perspective.id;
    const headId = newPerspective.details ? newPerspective.details.headId : undefined;
    const context = newPerspective.details ? newPerspective.details.context : undefined;
    const object = newPerspective.perspective.object;

    this.workspace.cache.writeQuery({
      query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
            }
            context {
              id
            }
          }
          _context {
            object
            casID
          }
        }
      }`,
      data: {
        entity: {
          __typename: 'Perspective',
          id: perspectiveId,
          head: {
            __typename: 'Commit',
            id: headId,
          },
          context: {
            __typename: 'Context',
            id: context,
          },
          _context: {
            __typename: 'EntityContext',
            object,
            casID: '',
          },
        },
      },
    });
  }

  private cacheUpdateHead(update: UpdateRequest) {
    const perspectiveId = update.perspectiveId;
    // TODO: keep track of old head?...

    this.workspace.cache.writeQuery({
      query: gql`{
        entity(ref: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
        }
      }`,
      data: {
        entity: {
          __typename: 'Perspective',
          id: perspectiveId,
          head: {
            __typename: 'Commit',
            id: update.newHeadId,
          },
        },
      },
    });
  }

  /** takes the Evees actions and replicates them in another client  */
  public async execute(client: ApolloClient<any>) {
    await this.executeCreate(client);
    await this.executeInit(client);
  }

  public async executeCreate(client: ApolloClient<any>) {
    const create = this.entities.map(async (entity) => {
      const mutation = await client.mutate({
        mutation: CREATE_ENTITY,
        variables: {
          object: entity.object,
          casID: entity.casID,
        },
      });

      const dataId = mutation.data.createEntity.id;

      if (dataId !== entity.id) {
        throw new Error(`created entity id ${dataId} not as expected ${entity.id}`);
      }
    });

    return Promise.all(create);
  }

  private async executeInit(client: ApolloClient<any>) {
    const createPerspective = async (newPerspective: NewPerspectiveData) => {
      const result = await client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          ...newPerspective.perspective.object.payload,
          ...newPerspective.details,
          authority: newPerspective.perspective.object.payload.authority,
          canWrite: newPerspective.canWrite,
          parentId: newPerspective.parentId,
        },
      });
      if (result.data.createPerspective.id !== newPerspective.perspective.id) {
        throw new Error(
          `created perspective id ${result.data.createPerspective.id} not as expected ${newPerspective.perspective.id}`
        );
      }
    };

    /** must run backwards and sequentially since new perspectives
     *  permissions depend on previous ones */
    await this.newPerspectives
      .reverse()
      .reduce(
        (promise, action) => promise.then((_) => createPerspective(action)),
        Promise.resolve()
      );
  }
}
