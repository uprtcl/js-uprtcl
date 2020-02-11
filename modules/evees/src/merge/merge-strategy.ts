import { UprtclAction } from '../types';

export interface MergeStrategy {
  /**
   * @returns the id of the resulting head commit of the perspective to merge to
   */
  mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config?: any
  ): Promise<[string, UprtclAction[]]>;

  /**
   * @returns the id of the resulting merge commit
   */
  mergeCommits(
    toCommitId: string,
    fromCommitId: string,
    dataSource: string,
    config?: any
  ): Promise<[string, UprtclAction[]]>;

  /**
   * Merges the links to other entities appropiately
   * @returns the new list of links
   */
  mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    config?: any
  ): Promise<[string[], UprtclAction[]]>;
}
