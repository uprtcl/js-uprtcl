import { Pattern } from '../../patterns/interfaces/pattern';

export interface EveesContentModule {
  /** custom configuration of the module */
  readonly config?: any;

  /** register web-components from the module */
  registerComponents?();

  /** get the JSON Patterns the module understands */
  getPatterns?(): Pattern<any>[];
}
