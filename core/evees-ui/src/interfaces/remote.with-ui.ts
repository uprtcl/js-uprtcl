import { TemplateResult } from 'lit-element';
import { ClientRemote } from '@uprtcl/evees';
import { Lens } from '../behaviours/has-lenses';

/** Adding UI specific methods. Remote implementations should also separate between a
 * JS only implementation and one with UI components. */
export interface RemoteWithUI extends ClientRemote {
  lense?(): Lens<{ remoteId: string }>;
  icon?(path?: string): TemplateResult;
  avatar?(userId: string, config: any): TemplateResult;
}
