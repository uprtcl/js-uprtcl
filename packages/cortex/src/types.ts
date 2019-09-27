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
