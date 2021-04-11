import { Lens } from '../behaviours/has-lenses';
import { Proposals } from '../../../evees/src/evees/proposals/proposals';

export interface ProposalsWithUI extends Proposals {
  lense(): Lens;
}
