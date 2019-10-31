import { TemplateResult } from 'lit-element';

import { Pattern } from './patterns/pattern';

export interface Lens {
  name: string;
  render: TemplateResult;
}

export interface PatternAction {
  icon: string;
  title: string;
  action: (element: HTMLElement) => any;
}

export interface LensElement<P> {
  data: P;
  editable?: boolean;
}

export interface Isomorphisms {
  entity: object;
  isomorphisms: Array<any>;
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

export const EntitiesTypes = {
  Module: Symbol('entities-reducer-module')
};

export const LensesTypes = {
  Module: Symbol('lenses-module')
};
