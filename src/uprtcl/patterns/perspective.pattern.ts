import { Perspective, Commit } from '../types';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { UprtclSource } from '../services/uprctl.source';
import { UprtclProvider } from '../services/uprtcl.provider';
import { LinkedPattern } from '../../patterns/patterns/linked.pattern';
import { RenderPattern } from '../../patterns/patterns/render.pattern';
import { ClonePattern } from '../../patterns/patterns/clone.pattern';
import { CreatePattern } from '../../patterns/patterns/create.pattern';

export const propertyOrder = ['origin', 'creatorId', 'timestamp', 'contextId', 'name'];

export class PerspectivePattern
  implements
    LinkedPattern<Secured<Perspective>>,
    RenderPattern<Secured<Perspective>>,
    ClonePattern<UprtclProvider, Secured<Perspective>>,
    CreatePattern<UprtclProvider, Perspective, Secured<Perspective>> {
  constructor(protected patternRegistry: PatternRegistry, protected uprtcl: UprtclSource) {}
  recognize(object: Object) {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  getHardLinks = (perspective: Secured<Perspective>) => [perspective.object.object.contextId];
  getSoftLinks = async (perspective: Secured<Perspective>) => {
    const head = await this.uprtcl.getHead(perspective.id).toPromise();
    return head ? [head] : [];
  };
  getLinks = (perspective: Secured<Perspective>) =>
    this.getSoftLinks(perspective).then(links => links.concat(this.getHardLinks(perspective)));

  async render(perspective: Secured<Perspective>) {
    const head = await this.uprtcl.getHead(perspective.id).toPromise();
    if (!head) return null;

    const commit = await this.uprtcl.get(head);

    if (!commit) return null;
    const commitProps = this.patternRegistry.from(commit) as RenderPattern<Commit>;
    return commitProps.render(commit as Commit);
  }

  clone(service: UprtclProvider, perspective: Secured<Perspective>): Promise<string> {
    return service.clonePerspective(perspective);
  }

  create(service: UprtclProvider, perspective: Perspective): Promise<any> {
    return service.createPerspective(perspective);
  }
}
