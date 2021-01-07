import { TemplateResult } from 'lit-element';
import { EveesRemote } from './remote.evees';

/** Adding UI specific methods. Remote implementations should also separate between a
 * JS only implementation and one with UI components. */
export interface RemoteWithUI extends EveesRemote {
  lense?(): Lens;
  icon?(path?: string): TemplateResult;
  avatar?(userId: string, config: any): TemplateResult;
}
