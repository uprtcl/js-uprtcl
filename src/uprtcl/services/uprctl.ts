import { UprtclService } from './uprtcl.service';
import { Provider } from '../../discovery/sources/provider';
import { CachedRemoteService } from '../../discovery/cached-remotes/cached-remote.service';
import { MultiRemoteService } from '../../discovery/multi/multi-remote.service';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { KnownSourcesService } from '../../discovery/known-sources/known-sources.service';
import { UprtclMultiRemote } from './uprtcl.multi-remote';

export class Uprtcl {
  cachedMultiRemote: CachedRemoteService<UprtclService>;

  constructor(cache: UprtclService, multiRemote: UprtclMultiRemote) {
    this.cachedMultiRemote = new CachedRemoteService<UprtclService>(cache, multiRemote);
  }
}
