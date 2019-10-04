import { Dictionary } from 'lodash';

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

export const CortexTypes = {
  PatternRecognizer: Symbol('pattern-recognizer'),
  Pattern: Symbol('pattern'),
  PatternsModule: Symbol('pattern-module'),
  DiscoveryService: Symbol('discovery-service'),
  DiscoverableSource: Symbol('discoverable-source'),
  EntitiesReducer: Symbol('entities-reducer'),
  LensesModule: Symbol('lenses-module'),
};
