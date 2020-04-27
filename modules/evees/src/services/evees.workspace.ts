import { injectable, inject } from 'inversify';
import { ApolloClientModule } from '@uprtcl/graphql';
import { ApolloClient, ApolloLink, QueryOptions, ApolloQueryResult, gql } from 'apollo-boost';
import Observable from 'zen-observable-ts';
import { cloneDeep } from 'lodash-es';
import {
  UprtclAction,
  CREATE_AND_INIT_PERSPECTIVE_ACTION,
  UPDATE_HEAD_ACTION,
  CREATE_DATA_ACTION,
  CREATE_COMMIT_ACTION
} from 'src/types';
import { Entity, PatternRecognizer } from '@uprtcl/cortex';
import { CREATE_ENTITY, CREATE_COMMIT, CREATE_PERSPECTIVE } from 'src/uprtcl-evees';

export class EveesWorkspace {
  private uprtclActions: UprtclAction[] = [];
  private workspace: ApolloClient<any>;

  constructor(protected recognizer: PatternRecognizer, protected client: ApolloClient<any>) {
    this.workspace = this.buildWorkspace(this.client);
  }

  private buildWorkspace(client: ApolloClient<any>): ApolloClient<any> {
    const link = new ApolloLink((operation, forward) => {
      return new Observable(observer => {
        client
          .query({
            query: operation.query,
            variables: operation.variables,
            context: operation.getContext()
          })
          .then(result => {
            observer.next(result);
            observer.complete();
          })
          .catch(error => {
            observer.error(error);
            observer.complete();
          });

        return () => {};
      });
    });

    const workspace = new ApolloClient<any>({
      cache: cloneDeep(client.cache),
      typeDefs: client.typeDefs,
      link: link
    });

    return workspace;
  }

  public query(options: QueryOptions): Promise<ApolloQueryResult<any>> {
    return this.workspace.query(options);
  }

  public addUprtclAction(action: UprtclAction) {
    this.uprtclActions.push(action);
    this.cacheAction(action);
  }

  public async execute() {
    const actions = this.uprtclActions;
    /** optimistic pre-fill the cache */
    const createDataPromises = actions
      .filter(a => a.type === CREATE_DATA_ACTION)
      .reverse()
      .map(async (action: UprtclAction) => {
        if (!action.entity) throw new Error('entity undefined');

        const mutation = await this.client.mutate({
          mutation: CREATE_ENTITY,
          variables: {
            object: action.entity.object,
            casID: action.payload.casID
          }
        });

        const dataId = mutation.data.createEntity.id;

        if (dataId !== action.entity.id) {
          throw new Error(`created entity id ${dataId} not as expected ${action.entity.id}`);
        }
      });

    await Promise.all(createDataPromises);

    const createCommitsPromises = actions
      .filter(a => a.type === CREATE_COMMIT_ACTION)
      .reverse()
      .map(async (action: UprtclAction) => {
        if (!action.entity) throw new Error('entity undefined');
        const result = await this.client.mutate({
          mutation: CREATE_COMMIT,
          variables: {
            ...action.entity.object.payload,
            casID: action.payload.casID
          }
        });
        const headId = result.data.createCommit.id;
        if (headId !== action.entity.id) {
          throw new Error(`created commit id ${headId} not as expected ${action.entity.id}`);
        }
      });

    await Promise.all(createCommitsPromises);

    const createPerspective = async (action: UprtclAction) => {
      if (!action.entity) throw new Error('entity undefined');

      const result = await this.client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          ...action.entity.object.payload,
          ...action.payload.details,
          authority: action.entity.object.payload.authority,
          canWrite: action.payload.owner,
          parentId: action.payload.parentId
        }
      });
      if (result.data.createPerspective.id !== action.entity.id) {
        throw new Error(
          `created commit id ${result.data.createPerspective.id} not as expected ${action.entity.id}`
        );
      }
    };

    /** must run sequentially since new perspectives
     *  permissions depend on previous ones */
    await actions
      .filter(a => a.type === CREATE_AND_INIT_PERSPECTIVE_ACTION)
      .reverse()
      .reduce((promise, action) => promise.then(_ => createPerspective(action)), Promise.resolve());
  }

  // Private helpers

  private cacheAction(action: UprtclAction) {
    if (action.type === CREATE_AND_INIT_PERSPECTIVE_ACTION && action.entity) {
      const perspectiveId = ((action.entity as unknown) as Entity<any>).id;
      const headId = action.payload.details.headId;
      const context = action.payload.details.context;

      const object = action.entity.object;

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
              id: headId
            },
            context: {
              __typename: 'Context',
              id: context
            },
            _context: {
              __typename: 'EntityContext',
              object,
              casID: ''
            }
          }
        }
      });
    } else if (action.entity) {
      const entity = action.entity;
      const type = this.recognizer.recognizeType(entity);

      this.client.writeQuery({
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
              casID: entity.casID
            }
          }
        }
      });
    }

    if (action.type === UPDATE_HEAD_ACTION) {
      const perspectiveId = action.payload.perspectiveId;

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
              id: action.payload.newHeadId
            }
          }
        }
      });
    }
  }
}
