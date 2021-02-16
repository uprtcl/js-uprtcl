import { PermissionsFixedLense } from './provider/evees-acl.fixed.lense';
import { EveesBlockchainCachedRemoteLense } from './provider/evees-remote.cached.lense';

export const registerComponents = (): void => {
  customElements.define('evees-permissions-fixed', PermissionsFixedLense);
  customElements.define('evees-blockchain-remote', EveesBlockchainCachedRemoteLense);
};
