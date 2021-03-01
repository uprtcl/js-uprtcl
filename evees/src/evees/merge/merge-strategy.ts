import { Entity } from '../../cas/interfaces/entity';

export interface MergeConfig {
  forceOwner?: boolean;
  remote?: string;
  guardianId?: string;
}

export interface MergeStrategy {
  /**
   * @returns the id of the resulting head commit of the perspective to merge to
   */
  mergePerspectives(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ): Promise<string>;

  /**
   * Since mergePerspectives is usually recursively called but reatins a global state, this method should be called
   * by the external service instead of mergePerspectives when it is known this is the first call to initialize the
   * clear the merge internal state */
  mergePerspectivesExternal(
    toPerspectiveId: string,
    fromPerspectiveId: string,
    config: MergeConfig
  ): Promise<string>;

  /**
   * @returns the id of the resulting merge commit
   */
  mergeCommits(
    toCommitId: string,
    fromCommitId: string,
    remoteId: string,
    config: MergeConfig
  ): Promise<string>;

  /**
   * Merges the links to other entities appropiately
   * @returns the new list of links
   */
  mergeLinks(originalLinks: string[], modificationsLinks: string[][], config: any): Promise<any[]>;
}
