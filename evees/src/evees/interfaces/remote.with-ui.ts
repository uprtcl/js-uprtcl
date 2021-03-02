import { TemplateResult } from 'lit-element';
import { Lens } from '../../patterns/behaviours/has-lenses';
import { RemoteEvees } from './remote.evees';

/** Adding UI specific methods. Remote implementations should also separate between a
 * JS only implementation and one with UI components. */
export interface RemoteWithUI extends RemoteEvees {
  lense?(): Lens<{ remoteId: string }>;
  icon?(path?: string): TemplateResult;
  avatar?(userId: string, config: any): TemplateResult;
}
