import { Evees } from 'src/services/evees.service';

export interface MergeStrategy {
  /**
   * @returns the id of the resulting head commit of the perspective to merge to
   */
  mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    evees: Evees,
    config: any
  ): Promise<string>;

  /**
   * Since mergePerspectives is usually recursively called, this method should be called
   * by the external service instead of mergePerspectives when it is known this is the
   * first call */
  mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    evees: Evees,
    config: any
  ): Promise<string>;

  /**
   * @returns the id of the resulting merge commit
   */
  mergeCommits(
    toCommitId: string,
    fromCommitId: string,
    dataSource: string,
    evees: Evees,
    config: any
  ): Promise<string>;

  /**
   * Merges the links to other entities appropiately
   * @returns the new list of links
   */
  mergeLinks(
    originalLinks: string[],
    modificationsLinks: string[][],
    evees: Evees,
    config: any
  ): Promise<any[]>;
}
