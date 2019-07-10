import { Source } from '../../discovery/remotes/sources/source';
import { Perspective, Context, Commit } from '../types';
import { Secured } from '../../entity/types';

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
   */
  createContext(context: Context): Promise<string>;

  /**
   * Create the given perspective in the service, returning the hash identifying the perspective
   *
   * @param perspective: the perspective to create
   */
  createPerspective(perspective: Perspective): Promise<string>;

  /**
   * Create the given commit in the service, returning the hash identifying the commit
   *
   * @param commit: the commit to create
   */
  createCommit(commit: Commit): Promise<string>;

  /**
   * Clone the given context in the service, validating its hash and its proof
   *
   * @param context: the signed context to clone
   */
  cloneContext(context: Secured<Context>): Promise<string>;

  /**
   * Clone the given perspective in the service, validating its hash and its proof
   *
   * @param perspective: the signed perspective to clone
   */
  clonePerspective(perspective: Secured<Perspective>): Promise<string>;

  /**
   * Clone the given commit in the service, validating its hash and its proof
   *
   * @param commit: the signed commit to clone
   */
  cloneCommit(commit: Secured<Commit>): Promise<string>;

  /**
   * Support modifiers
   */

  /**
   * Set the head of a perspective to a given commitId
   * @param perspectiveId: ID of the perspective. Cannot be empty and must exist on the platform.
   * @param headId: ID of the commit. Cannot be empty but MAY not exist in the platform.
   */
  updateHead(perspectiveId: string, headId: string): Promise<void>;

  /**
   * Get the head of a perspective
   * @param perspectiveId: ID of the perspective. Cannot be empty and must exist on the platform.
   */
  getHead(perspectiveId: string): Promise<string | undefined>;
}
