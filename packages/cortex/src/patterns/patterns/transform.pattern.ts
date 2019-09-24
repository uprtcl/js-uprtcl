

export interface TransformPattern<T extends object, R extends Array<any>> {

  transform: (entity: T) => R;
}
