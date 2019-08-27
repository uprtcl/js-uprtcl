import {
  LinkedPattern,
  Pattern,
  Commit,
  Secured,
  RenderPattern,
  PatternRegistry,
  Source,
  SecuredPattern
} from '@uprtcl/cortex';

export const propertyOrder = ['creatorId', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern
  implements Pattern, LinkedPattern<Secured<Commit>>, RenderPattern<Secured<Commit>> {
  constructor(
    protected patternRegistry: PatternRegistry,
    protected securedPattern: Pattern & SecuredPattern<Secured<Commit>>,
    protected source: Source
  ) {}

  recognize(object: object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.extract(object as Secured<Commit>).hasOwnProperty(p)
      )
    );
  }

  getHardLinks = (commit: Secured<Commit>) => [
    commit.object.payload.dataId,
    ...commit.object.payload.parentsIds
  ];
  getSoftLinks = async (commit: Secured<Commit>) => [] as string[];
  getLinks = (commit: Secured<Commit>) =>
    this.getSoftLinks(commit).then(links => links.concat(this.getHardLinks(commit)));

  async render(commit: Secured<Commit>) {
    const data = await this.source.get(commit.object.payload.dataId);

    if (!data) return null;
    const dataProps = this.patternRegistry.from(data) as RenderPattern<any>;
    return dataProps.render(data);
  }
}
