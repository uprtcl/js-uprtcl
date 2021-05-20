export interface Entity<T = any> {
  hash: string; // The id must be set
  object: T;
  remote: string; // The remote must be set
}

export interface EntityCreate<T = any> {
  hash?: string; // The id may be specified
  object: T;
  remote?: string; // The remote may be specified
}
