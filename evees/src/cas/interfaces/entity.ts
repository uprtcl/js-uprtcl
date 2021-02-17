export interface Entity<T> {
  id: string;
  object: T;
}

export interface ObjectOn {
  object: object;
  remote?: string;
  casID?: string;
}

export interface EntityOn {
  entity: Entity<any>;
  remote?: string;
  casID?: string;
}
