export interface Entity<T> {
  id: string;
  object: T;
  remotes?: string[];
}
