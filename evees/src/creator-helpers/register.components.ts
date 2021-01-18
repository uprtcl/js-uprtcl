import { EveesContainer } from '../container/evees-container';
import { Evees } from '../evees/evees.service';
import { registerEveesElements } from './evees.elements';

export const registerComponents = (evees: Evees) => {
  /** register evees components */
  registerEveesElements();

  /** register module-specific components */
  if (evees.modules) {
    evees.modules.forEach((module) => {
      if (module.registerComponents) {
        module.registerComponents();
      }
    });
  }

  /** register module container */
  customElements.define('evees-container', EveesContainer(evees));
};
