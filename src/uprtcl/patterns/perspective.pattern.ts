import { LinkedProperties, softLinkedProperties } from '../../patterns/linked.pattern';
import { UprtclService } from '../services/uprtcl.service';
import { Pattern } from '../../patterns/pattern';
import { Perspective } from '../types';
import { Secured } from '../../patterns/derive/secured.pattern';
import { RenderProperties } from '../../patterns/render.pattern';
import PatternRegistry from '../../patterns/registry/pattern.registry';

export const propertyOrder = ['origin', 'creatorId', 'timestamp', 'contextId', 'name'];

export interface PerspectiveProperties extends LinkedProperties, RenderProperties {}

export const perspectivePattern = (
  uprtcl: UprtclService,
  patternRegistry: PatternRegistry
): Pattern<Secured<Perspective>, PerspectiveProperties> => ({
  recognize: (object: Object) => propertyOrder.every(p => object.hasOwnProperty(p)),
  properties(perspective: Secured<Perspective>) {
    const getSoftLinks = async () => {
      const head = await uprtcl.getHead(perspective.id);
      return head ? [head] : [];
    };

    const getHardLinks = () => [perspective.object.object.contextId];

    const render = async () => {
      const head = await uprtcl.getHead(perspective.id);
      if (!head) return null;

      const commit = await uprtcl.get(head);

      if (!commit) return null;
      const commitProps = patternRegistry.from(commit) as RenderProperties;
      return commitProps.render();
    };

    return {
      ...softLinkedProperties(getSoftLinks, getHardLinks),
      render
    };
  }
});
