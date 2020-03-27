export interface Entity<T> {
  // Hash
  id: string;
  entity: T;
  casID?: string;
}
