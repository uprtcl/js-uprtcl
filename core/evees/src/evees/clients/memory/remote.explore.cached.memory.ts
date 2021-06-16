import { ClientRemote, PartialPerspective, Perspective, Secured } from '../../interfaces';
import { ExploreCachedOnMemory } from './explore.cached.memory';

export class RemoteExploreCachedOnMemory extends ExploreCachedOnMemory implements ClientRemote {
  constructor(protected base: ClientRemote) {
    super(base);
  }

  get accessControl() {
    return this.base.accessControl;
  }
  get id() {
    return this.base.id;
  }
  get defaultPath() {
    return this.base.defaultPath;
  }
  get entityRemote() {
    return this.base.entityRemote;
  }

  get userId() {
    return this.base.userId;
  }

  snapPerspective(
    perspective: PartialPerspective,
    guardianId?: string
  ): Promise<Secured<Perspective>> {
    return this.base.snapPerspective(perspective, guardianId);
  }
  ready(): Promise<void> {
    return this.base.ready();
  }
  connect(): Promise<void> {
    return this.base.connect();
  }
  isConnected(): Promise<boolean> {
    return this.base.isConnected();
  }
  disconnect(): Promise<void> {
    return this.base.disconnect();
  }
  isLogged(): Promise<boolean> {
    return this.base.isLogged();
  }
  login(): Promise<void> {
    return this.base.login();
  }
  logout(): Promise<void> {
    return this.base.logout();
  }
}
