export interface PatternAction {
  icon: string;
  title: string;
  action: (element: HTMLElement) => any;
}

export interface HasActions {
  /**
   * @returns the actions available for the given object
   */
  getActions(object: object, entityId: string): PatternAction[];
}
