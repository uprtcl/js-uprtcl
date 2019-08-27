import { Lens } from '../../types';

export interface LensesPattern {
  getLenses(): Lens[];
}
