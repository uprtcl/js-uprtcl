export interface Entity<T = any> {
  id: string; // The id must be set
  object: T;
  casID: string; // The casID must be known
  remote?: string; // The remote may be specified
}

export interface EntityCreate<T = any> {
  id?: string; // The id may be specified
  object: T;
  casID?: string; // The casID may be specified
  remote?: string; // The remote may be specified
}
