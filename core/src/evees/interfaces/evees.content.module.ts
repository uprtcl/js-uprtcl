import { Pattern } from 'src/evees/elements/node_modules/src/evees/patterns/node_modules/src/evees/merge/node_modules/src/evees/behaviours/node_modules/@uprtcl/cortex';

export interface EveesContentModule {
  /** a name to identify the module */
  readonly id: string;

  /** custom configuration of the module */
  readonly config?: any;

  /** register web-components from the module */
  registerComponents?();

  /** get the JSON Patterns the module understands */
  getPatterns?(): Pattern<any>[];
}
