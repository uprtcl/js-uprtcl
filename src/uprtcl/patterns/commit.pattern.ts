import { LinkedPattern } from '../../patterns/patterns/linked.pattern';
import { Pattern } from '../../patterns/pattern';
import { Commit } from '../types';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import { RenderPattern } from '../../patterns/patterns/render.pattern';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { UprtclSource } from '../services/uprctl.source';

export const propertyOrder = ['creatorId', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern
  implements Pattern, LinkedPattern<Commit>, RenderPattern<Secured<Commit>> {
  constructor(protected patternRegistry: PatternRegistry, protected uprtcl: UprtclSource) {}

  recognize(object: Object) {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  getHardLinks = (commit: Commit) => [commit.dataId, ...commit.parentsIds];
  getSoftLinks = async (commit: Commit) => [] as string[];
  getLinks = (commit: Commit) =>
    this.getSoftLinks(commit).then(links => links.concat(this.getHardLinks(commit)));

  async render(commit: Secured<Commit>) {
    const data = await this.uprtcl.get(commit.object.object.dataId);

    if (!data) return null;
    const dataProps = this.patternRegistry.from(data) as RenderPattern<any>;
    return dataProps.render(data);
  }
}
