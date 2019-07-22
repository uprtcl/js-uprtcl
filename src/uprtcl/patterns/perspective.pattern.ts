import { Perspective, Commit } from '../types';
import { Secured } from '../../patterns/defaults/default-secured.pattern';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { UprtclSource } from '../services/uprctl.source';
import { LinkedPattern } from '../../patterns/patterns/linked.pattern';
import { RenderPattern } from '../../patterns/patterns/render.pattern';
import { Pattern } from '../../patterns/pattern';
import { SecuredPattern } from '../../patterns/patterns/secured.pattern';

export const propertyOrder = ['origin', 'creatorId', 'timestamp', 'contextId', 'name'];

export class PerspectivePattern
  implements LinkedPattern<Secured<Perspective>>, RenderPattern<Secured<Perspective>> {
  constructor(
    protected patternRegistry: PatternRegistry,
    protected securedPattern: Pattern & SecuredPattern<Secured<Perspective>>,
    protected uprtcl: UprtclSource
  ) {}

  recognize(object: Object) {
    return (
      this.securedPattern.recognize(object) &&
      propertyOrder.every(p =>
        this.securedPattern.getObject<Perspective>(object as Secured<Perspective>).hasOwnProperty(p)
      )
    );
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
}
