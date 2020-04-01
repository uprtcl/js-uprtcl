export interface Entity<T> {
  // Hash
  id: string;
  entity: T;
  casID?: string;
}

export function recognizeEntity(object: any): object is Entity<any> {
  const entity = object as Entity<any>;
  return (typeof object === 'object' &&
    entity.id &&
    typeof entity.id === 'string' &&
    entity.entity !== null) as boolean;
}
