import { PatternAction } from '../../types';

export interface HasActions {
  /**
   * @returns the actions available for the given object
   */
  getActions(object: object, entityId: string): PatternAction[];
}
