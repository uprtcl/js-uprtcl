export const LOAD_ENTITY = '[ENTITIES] LOAD_ENTITY';
export const LOAD_ENTITY_SUCCESS = '[ENTITIES] LOAD_ENTITY_SUCCESS';

export interface LoadEntity {
  type: typeof LOAD_ENTITY;
  payload: {
    hash: string;
  };
}

export interface LoadEntitySuccess {
  type: typeof LOAD_ENTITY_SUCCESS;
  payload: {
    hash: string;
    entity: object;
  };
}

export type EntityActions = LoadEntity | LoadEntitySuccess;
