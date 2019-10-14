import { Perspective, Context, Commit } from '../types';
import { Secured, Hashed } from '@uprtcl/cortex';
import { UprtclSource } from './uprctl.source';

export interface UprtclProvider extends UprtclSource {

  /**
   * Create a new perspective in the service
   *
   * @param name the name of the perspective
   * @param timestamp the time of creation of the perspective
   *
   * @returns the created perspective, with its hashed id
   */
  createPerspective(name: string, timestamp: number): Promise<Secured<Perspective>>;

  /**
   * Create a new commit in the service
   *
   * @param dataId the data that the commit should contain
   * @param parentsIds the list of parent commits ids
   * @param message a message to explain the contents of the commit
   * @param timestamp the time of creation of the commit
   *
   * @returns the created commit, with its hashed id
   */
  createCommit(
    dataId: string,
    parentsIds: Array<string>,
    message: string,
    timestamp: number
  ): Promise<Secured<Commit>>;

  /**
   * Clone the given perspective in the service, validating its hash and its proof
   *
   * @param perspective: the signed perspective to clone
   * @returns the id of the cloned perspective
   */
  clonePerspective(perspective: Secured<Perspective>): Promise<string>;

  /**
   * Clone the given commit in the service, validating its hash and its proof
   *
   * @param commit: the signed commit to clone
   * @returns the id of the cloned commit
   */
  cloneCommit(commit: Secured<Commit>): Promise<string>;

  /**
   * Modifiers
   */

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
