export const LOAD_ENTITY = 'LOAD_ENTITY';

export interface LoadEntity {
  type: typeof LOAD_ENTITY;
  payload: {
    hash: string;
  };
}

export const LOAD_ENTITY_SUCCESS = 'LOAD_ENTITY_SUCCESS';

export interface LoadEntitySuccess {
  type: typeof LOAD_ENTITY_SUCCESS;
  payload: {
    hash: string;
    entity: object;
  };
}

export type EntityActions = LoadEntity | LoadEntitySuccess;
