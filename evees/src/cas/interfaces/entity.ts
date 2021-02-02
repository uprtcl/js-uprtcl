export interface Entity<T> {
  id: string;
  object: T;
}

export interface ObjectOnRemote {
  object: object;
  remote: string;
}

export interface EntityOnRemote {
  entity: Entity<any>;
  remote: string;
}
