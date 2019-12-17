export const DiscoveryTypes = {
  Module: Symbol('discovery-module'),
  DiscoveryService: Symbol('discovery-service'),
  Source: Symbol('sources'),
  MultiSource: Symbol('multi-source'),
  Cache: Symbol('cache-service'),
  LocalKnownSources: Symbol('local-known-sources')
};

export const CortexTypes = {
  Module: Symbol('cortex-module'),
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
