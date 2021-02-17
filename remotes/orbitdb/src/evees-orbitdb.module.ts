import { PermissionsOrbitdDb } from './provider/evees-acl.orbit-db.lense';
import { RemoteOrbitdDbLense } from './provider/evees-remote.orbit-db.lense';
import { OrbitDBProfile } from './provider/profile/orbitdb.profile';

export const registerComponents = () => {
  customElements.define('evees-orbitdb-permissions', PermissionsOrbitdDb);
  customElements.define('evees-orbitdb-remote', RemoteOrbitdDbLense);
  customElements.define('orbitdb-profile', OrbitDBProfile);
};
