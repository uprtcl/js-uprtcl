import { tagged, multiInject, injectable, inject } from 'inversify';
import {
  DiscoverableSource,
  MultiProviderService,
  CachedMultiProviderService,
  KnownSourcesService,
  DiscoveryTypes,
  PatternTypes,
  PatternRecognizer
} from '@uprtcl/cortex';

import { UprtclTypes, UprtclCache } from '../types';
import { UprtclProvider } from '../uprtcl-common';

@injectable()
export class UprtclMultiplatform extends CachedMultiProviderService<UprtclCache, UprtclProvider> {
  constructor(
    @inject(PatternTypes.Recognizer) protected recognizer: PatternRecognizer,
    @inject(DiscoveryTypes.LocalKnownSources)
    protected knownSources: KnownSourcesService,
    @inject(UprtclTypes.UprtclCache)
    protected uprtclLocal: UprtclCache,
    @multiInject(UprtclTypes.UprtclProvider)
    protected uprtclRemotes: DiscoverableSource<UprtclProvider>[]
  ) {
    super(
      uprtclLocal,
      new MultiProviderService<UprtclProvider>(recognizer, knownSources, uprtclRemotes)
    );
  }
}
