import { Perspective, Context, Commit } from '../types';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import { UprtclSource } from './uprctl.source';

export interface UprtclMultiProvider extends UprtclSource {
  /**
   * Create the given context in the service, returning the hash identifying the context
   *
   * @param context: the context to create
   * @returns the id of the created context
   */
  createContextIn(source: string, context: Context): Promise<Secured<Context>>;

  /**
   * Create the given perspective in the service, returning the hash identifying the perspective
   *
   * @param perspective: the perspective to create
   * @returns the id of the created perspective
   */
  createPerspectiveIn(source: string, perspective: Perspective): Promise<Secured<Perspective>>;

  /**
   * Create the given commit in the service, returning the hash identifying the commit
   *
   * @param commit: the commit to create
   * @returns the id of the created commit
   */
  createCommitIn(source: string, commit: Commit): Promise<Secured<Commit>>;

  /**
   * Clone the given context in the service, validating its hash and its proof
   *
   * @param context: the signed context to clone
   * @returns the id of the cloned context
   */
  cloneContextIn(source: string, context: Secured<Context>): Promise<string>;

  /**
   * Clone the given perspective in the service, validating its hash and its proof
   *
   * @param perspective: the signed perspective to clone
   * @returns the id of the cloned perspective
   */
  clonePerspectiveIn(source: string, perspective: Secured<Perspective>): Promise<string>;

  /**
   * Clone the given commit in the service, validating its hash and its proof
   *
   * @param commit: the signed commit to clone
   * @returns the id of the cloned commit
   */
  cloneCommitIn(source: string, commit: Secured<Commit>): Promise<string>;

  /**
   * Support modifiers
   */

  /**
   * Set the head of a perspective to a given commitId
   * @param perspectiveId id of the perspective of which to update the head
   * @param headId id of the commit
   */
  updateHead(perspectiveId: string, headId: string): Promise<void>;
}
