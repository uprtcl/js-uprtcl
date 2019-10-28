import { Perspective, Commit } from '../../types';
import { Secured } from '@uprtcl/cortex';
import { UprtclSource } from './uprtcl.source';
import { ProposalProvider } from './proposal.provider';

export interface UprtclProvider extends UprtclSource {
  /** Proposals */

  // proposals: ProposalProvider;

  /** Cloners */

  /**
   * Clone a new perspective in the service
   *
   * @param perspective: the signed perspective to create
   */
  clonePerspective(perspective: Secured<Perspective>): Promise<void>;

  /**
   * Clone the given commit in the service
   *
   * @param commit: the signed commit to clone
   */
  cloneCommit(commit: Secured<Commit>): Promise<void>;

  /** Modifiers */

  /**
   * Set the head of a perspective to a given commitId
   * @param perspectiveId id of the perspective of which to update the head
   * @param headId id of the commit
   */
  updatePerspectiveHead(perspectiveId: string, headId: string): Promise<void>;

  /**
   * Set the context of a perspective
   * @param perspectiveId id of the perspective of which to update the head
   * @param context the context to set the perspective to
   */
  updatePerspectiveContext(perspectiveId: string, context: string): Promise<void>;
}
