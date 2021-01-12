import { TemplateResult } from 'src/evees/elements/node_modules/lit-element';

import { Lens } from '@uprtcl/lenses';

import { RemoteEvees } from './remote.evees';

/** Adding UI specific methods. Remote implementations should also separate between a
 * JS only implementation and one with UI components. */
export interface RemoteWithUI extends RemoteEvees {
  lense?(): Lens;
  icon?(path?: string): TemplateResult;
  avatar?(userId: string, config: any): TemplateResult;
  proposal?(proposalId: string): Lens;
}
