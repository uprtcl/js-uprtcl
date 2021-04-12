import { registerCommonUI } from '@uprtcl/common-ui';
import { Evees } from '@uprtcl/evees';

import { registerEveesElements } from './elements/register.evees.elements';

export const registerComponents = (evees: Evees) => {
  /** register common ui */
  registerCommonUI();

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
};
