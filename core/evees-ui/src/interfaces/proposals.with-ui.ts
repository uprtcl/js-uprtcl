import { Proposals } from '@uprtcl/evees';
import { Lens } from '../behaviours/has-lenses';

export interface ProposalsWithUI extends Proposals {
  lense(): Lens;
}
