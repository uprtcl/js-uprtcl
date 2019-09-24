import { Lens } from '../../types';

export interface LensesPattern {
  getLenses(object?: object): Lens[];
}
