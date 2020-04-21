import { Entity } from '@uprtcl/cortex';

export interface ResolveEntity {
  resolve: (entityReference: string) => Promise<Entity<any> | undefined>;
}
