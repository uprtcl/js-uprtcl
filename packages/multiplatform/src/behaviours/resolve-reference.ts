import { Entity } from '@uprtcl/cortex';

export interface ResolveReference {
  resolve: (ref: string) => Promise<Entity<any> | undefined>;
}
