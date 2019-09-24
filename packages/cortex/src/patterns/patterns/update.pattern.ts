

export interface UpdatePattern<T extends object = any, C = any> {
  update: (entity: T, newContent: C) => Promise<void>;
}
