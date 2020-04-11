import { NodeActions } from '../types';

export interface MergeStrategy {
  /**
   * @returns the id of the resulting head commit of the perspective to merge to
   */
  mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string
  ): Promise<NodeActions>;

  /**
   * @returns the id of the resulting merge commit
   */
  mergeCommits(
    toCommitId: string,
    fromCommitId: string,
    dataSource: string
  ): Promise<NodeActions>;

  /**
   * Merges the links to other entities appropiately
   * @returns the new list of links
   */
  mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][]
  ): Promise<NodeActions[]>;
}
