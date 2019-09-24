import { PatternAction } from '../../types';

export interface ActionsPattern {
  /**
   * @returns the actions available for the given object
   */
  getActions(object: object): PatternAction[];
}
