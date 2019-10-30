export interface Transformable<R extends Array<any>> {
  transform: (entity: any) => R;
}
