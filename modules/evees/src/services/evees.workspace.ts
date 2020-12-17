import cloneDeep from 'lodash-es/cloneDeep';
import { Entity, PatternRecognizer } from '@uprtcl/cortex';
import { UpdateRequest, NewPerspectiveData } from '../types';

export class EveesClient {
  private entities: Entity<any>[] = [];
  private newPerspectives: NewPerspectiveData[] = [];
  private updates: UpdateRequest[] = [];

  public workspace: EveesClient;

  constructor(client: EveesClient, protected recognizer?: PatternRecognizer) {
    this.workspace = this.buildWorkspace(client);
  }

  private buildWorkspace(client: EveesClient): EveesClient {
    const workspace = new EveesClient({
      cache: cloneDeep(client.cache),
      typeDefs: client.typeDefs,
      link: link,
    });

    return workspace;
  }

  public hasUpdates() {
    return this.updates.length > 0;
  }

  public async isSingleAuthority(remote: string) {
    const newNot = this.newPerspectives.find(
      (newPerspective) =>
        newPerspective.perspective.object.payload.remote !== remote
    );
    if (newNot !== undefined) return false;

    const check = this.updates.map(async (update) =>
      EveesHelpers.getPerspectiveRemoteId(this.workspace, update.perspectiveId)
    );
    const checktoPerspectives = await Promise.all(check);

    const updateNot = checktoPerspectives.find(
      (_remoteId) => _remoteId !== remote
    );
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
    this.cacheCreateEntity(this.workspace, entity);
  }

  public newPerspective(newPerspective: NewPerspectiveData) {
    /* perspective entity is stored as an entity too */
    this.create(newPerspective.perspective);
    this.newPerspectives.push(newPerspective);
    this.cacheInitPerspective(this.workspace, newPerspective);
  }

  public update(update: UpdateRequest) {
    this.updates.push(update);
    this.cacheUpdateHead(this.workspace, update);
  }

  public cacheCreateEntity(client: EveesClient, entity: Entity<any>) {
    if (!this.recognizer) throw new Error('recognized not provided');

    const type = this.recognizer.recognizeType(entity);

    client.writeQuery({
      query: gql`{
        entity(uref: "${entity.id}") {
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

  public cacheInitPerspective(
    client: EveesClient,
    newPerspective: NewPerspectiveData
  ) {
    const perspectiveId = newPerspective.perspective.id;
    const headId = newPerspective.details
      ? newPerspective.details.headId
      : undefined;
    const object = newPerspective.perspective.object;

    client.cache.writeQuery({
      query: gql`{
        entity(uref: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
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
          _context: {
            __typename: 'EntityContext',
            object,
            casID: '',
          },
        },
      },
    });
  }

  public cacheUpdateHead(client: EveesClient, update: UpdateRequest) {
    const perspectiveId = update.perspectiveId;
    // TODO: keep track of old head?...

    client.cache.writeQuery({
      query: gql`{
        entity(uref: "${perspectiveId}") {
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
  public async execute(client: EveesClient) {
    await this.executeCreate(client);
    await this.executeInit(client);
    return this.executeUpdate(client);
  }

  public async executeCreate(client: EveesClient) {
    const create = this.entities.map(async (entity) => {
      const mutation = await client.mutate({
        mutation: CREATE_ENTITY,
        variables: {
          id: entity.id,
          object: entity.object,
          casID: entity.casID,
        },
      });

      const dataId = mutation.data.createEntity.id;

      if (dataId !== entity.id) {
        throw new Error(
          `created entity id ${dataId} not as expected ${entity.id}`
        );
      }
    });

    return Promise.all(create);
  }

  /* Takes the new perspectives and sets their head in the cache 
     before the perspective is actually created */
  public precacheInit(client: EveesClient) {}

  private async executeInit(client: EveesClient) {
    const createPerspective = async (newPerspective: NewPerspectiveData) => {
      const result = await client.mutate({
        mutation: CREATE_PERSPECTIVE,
        variables: {
          ...newPerspective.perspective.object.payload,
          ...newPerspective.details,
          remote: newPerspective.perspective.object.payload.remote,
          path: newPerspective.perspective.object.payload.path,
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

  /** copies the new perspective data (head) in the workspace into the
   *  cache of an client */
  public async precacheNewPerspectives(client: EveesClient) {
    this.newPerspectives.reverse().map((newPerspective) => {
      this.cacheInitPerspective(client, newPerspective);
    });
  }

  public async executeUpdate(client: EveesClient) {
    const update = this.getUpdates().map(async (update) => {
      return client.mutate({
        mutation: UPDATE_HEAD,
        variables: {
          perspectiveId: update.perspectiveId,
          headId: update.newHeadId,
        },
      });
    });

    return Promise.all(update);
  }
}
