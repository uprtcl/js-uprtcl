import { LinkedPattern } from '../../patterns/patterns/linked.pattern';
import { Pattern } from '../../patterns/pattern';
import { Commit } from '../types';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import { RenderPattern } from '../../patterns/patterns/render.pattern';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { UprtclSource } from '../services/uprctl.source';
import { ClonePattern } from '../../patterns/patterns/clone.pattern';
import { UprtclProvider } from '../services/uprtcl.provider';
import { CreatePattern } from '../../patterns/patterns/create.pattern';

export const propertyOrder = ['creatorId', 'timestamp', 'message', 'parentsIds', 'dataId'];

export class CommitPattern
  implements
    Pattern,
    LinkedPattern<Commit>,
    RenderPattern<Secured<Commit>>,
    ClonePattern<Secured<Commit>, UprtclProvider>,
    CreatePattern<Commit, Secured<Commit>, UprtclProvider> {
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

  clone(commit: Secured<Commit>, service: UprtclProvider): Promise<string> {
    return service.cloneCommit(commit);
  }

  create(commit: Commit, service: UprtclProvider): Promise<Secured<Commit>> {
    return service.createCommit(commit);
  }
}
