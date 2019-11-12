export interface UplAuth {
  userId: string | undefined;
}

export const DiscoveryTypes = {
  Module: Symbol('discovery-module'),
  DiscoveryService: Symbol('discovery-service'),
  DiscoverableSource: Symbol('discoverable-source'),
  MultiSource: Symbol('multi-source'),
  Cache: Symbol('cache-service'),
  LocalKnownSources: Symbol('local-known-sources')
};

export const PatternTypes = {
  Module: Symbol('pattern-module'),
  Factory: Symbol('pattern-factory'),
  Recognizer: Symbol('pattern-recognizer'),
  Pattern: Symbol('pattern'),
  Core: {
    Hashed: Symbol('hashed'),
    Signed: Symbol('signed'),
    Secured: Symbol('secured')
  }
};

export const LensesTypes = {
  Module: Symbol('lenses-module')
};
