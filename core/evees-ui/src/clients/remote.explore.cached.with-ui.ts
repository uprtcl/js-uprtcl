import { RemoteExploreCachedOnMemory } from '@uprtcl/evees';

import { RemoteWithUI } from '../interfaces/remote.with-ui';

export class RemoteExploreCachedOnMemoryWithUI
  extends RemoteExploreCachedOnMemory
  implements RemoteWithUI {
  constructor(protected base: RemoteWithUI) {
    super(base);
  }

  lense() {
    return this.base.lense ? this.base.lense() : (undefined as any);
  }
  icon(path?: string) {
    return this.base.icon ? this.base.icon(path) : (undefined as any);
  }
  avatar(userId: string, config: any) {
    return this.base.avatar ? this.base.avatar(userId, config) : (undefined as any);
  }
}
