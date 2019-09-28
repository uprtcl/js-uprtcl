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
