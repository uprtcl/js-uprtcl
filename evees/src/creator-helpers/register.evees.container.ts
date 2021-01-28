import { EveesContainer } from 'src/container/evees-container';
import { Evees } from '../evees/evees.service';

export const registerEveesContainer = (evees: Evees) => {
  /** register module container */
  customElements.define('evees-container', EveesContainer(evees));
};
