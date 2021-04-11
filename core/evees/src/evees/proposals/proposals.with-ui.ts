import { Lens } from '../../patterns/behaviours/has-lenses';
import { Proposals } from './proposals';

export interface ProposalsWithUI extends Proposals {
  lense(): Lens;
}
