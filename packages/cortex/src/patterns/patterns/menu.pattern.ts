import { MenuItem } from '../../types';

export interface MenuPattern {
  /**
   * @returns the groups of menu items that this pattern should show
   */
  getMenuItems(): MenuItem[][];
}
