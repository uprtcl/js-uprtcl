export interface Entity<T = any> {
  id: string;
  object: T;
  casID: string;
}

export interface EntityCreate<T = any> {
  id?: string;
  object: T;
  casID?: string;
  remote?: string;
}
