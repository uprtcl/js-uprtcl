import { Perspective, Context, Commit } from '../types';
import { Source } from '../../discovery/sources/source';
import { Secured } from '../../patterns/derive/secured.pattern';

export interface UprtclService extends Source {
  /**
   * Returns all the perspectives associated to a
   * context.
   *
   * @param contextId The context id
   */
  //  getContextPerspectives(contextId: string): Promise<Perspective[]>;

  /**
   * Create the given context in the service, returning the hash identifying the context
   *
   * @param context: the context to create
   * @returns the id of the created context
   */
  createContext(context: Context): Promise<string>;

  /**
   * Create the given perspective in the service, returning the hash identifying the perspective
   *
   * @param perspective: the perspective to create
   * @returns the id of the created perspective
   */
  createPerspective(perspective: Perspective): Promise<string>;

  /**
   * Create the given commit in the service, returning the hash identifying the commit
   *
   * @param commit: the commit to create
   * @returns the id of the created commit
   */
  createCommit(commit: Commit): Promise<string>;

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
   * Support modifiers
   */

  /**
   * Set the head of a perspective to a given commitId
   * @param perspectiveId id of the perspective of which to update the head
   * @param headId id of the commit
   */
  updateHead(perspectiveId: string, headId: string): Promise<void>;

  /**
   * Get the head of a perspective
   * @param perspectiveId id of the perspective to get the head of
   * @returns the id of the head commit of the perspective, if exists
   */
  getHead(perspectiveId: string): Promise<string | undefined>;
}
