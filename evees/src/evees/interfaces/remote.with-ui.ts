import { RemoteEvees } from './remote.evees';

/** Adding UI specific methods. Remote implementations should also separate between a
 * JS only implementation and one with UI components. */
export interface RemoteWithUI extends RemoteEvees {
  lense?(): Lens;
  icon?(path?: string): TemplateResult;
  avatar?(userId: string, config: any): TemplateResult;
  proposal?(proposalId: string): Lens;
}
