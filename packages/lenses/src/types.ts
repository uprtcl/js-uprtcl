import { Dictionary } from 'lodash';

export interface Lens {
  lens: string;
  params: Dictionary<any>;
}

export interface MenuItem {
  icon: string;
  title: string;
  action: () => any;
}
