import { Dictionary } from 'lodash';
import { Pattern } from './patterns/pattern';

export interface Lens {
  lens: string;
  params: Dictionary<any>;
}

export interface PatternAction {
  icon: string;
  title: string;
  action: (element: HTMLElement) => any;
}

export interface LensElement<P> {
  data: P;
}

export interface Isomorphism {
  entity: object;
  lenses: Lens[];
  actions: PatternAction[];
}

export interface SelectedLens {
  isomorphism: number;
  lens: number;
}

export type PatternFactory = () => Pattern[];

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
