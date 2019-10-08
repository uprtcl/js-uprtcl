import { Perspective, Context, Commit } from '../types';
import { Secured } from '@uprtcl/cortex';
import { UprtclSource } from './uprctl.source';

export interface UprtclProvider extends UprtclSource {

  /**
    * Create a new context in the service
    *
    * @param timestamp the time of the creation of the context
    * @param nonce arbritrary nonce to differentiate contexts created at the same time
    *
    * @returns the created context, with its hashed id
    */
   createContext(timestamp: number, nonce: number): Promise<Secured<Context>>;

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
  createCommit(dataId: string, parentsIds: Array<string>, message: string, timestamp: number): Promise<Secured<Commit>>;

  /**
   * Clone the given context in the service, validating its hash and its proof
   *
   * @param context: the signed context to clone
   * @returns the id of the cloned context
   */
  cloneContext(context: Secured<Context>): Promise<string>;

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
   * @param contextId id of the context to set the perspective to
   */
  updatePerspectiveContext(perspectiveId: string, contextId: string): Promise<void>;
}
