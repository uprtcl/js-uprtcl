import { UpdateRequest } from '../types';

export interface MergeStrategy {
  /**
   * @returns the id of the resulting head commit of the perspective to merge to
   */
  mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string
  ): Promise<UpdateRequest[]>;

  /**
   * @returns the id of the resulting merge commit
   */
  mergeCommits(toCommitId: string, fromCommitId: string, commitSource: string, dataSource: string): Promise<string>;

  /**
   * Merges the links to other entities appropiately
   * @returns the new list of links
   */
  mergeLinks(originalLinks: string[], modificationsLinks: string[][]): Promise<string[]>;
}
