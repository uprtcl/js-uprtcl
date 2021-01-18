export interface Entity<T> {
  id: string;
  object: T;
  remotes?: string[];
}

export interface ObjectOnRemote {
  object: object;
  remote: string;
}
