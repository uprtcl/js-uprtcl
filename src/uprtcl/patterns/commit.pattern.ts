import { LinkedProperties, softLinkedProperties } from '../../patterns/linked.pattern';
import { Pattern } from '../../patterns/pattern';
import { Commit } from '../types';
import { Secured } from '../../patterns/derive/secured.pattern';
import { RenderProperties } from '../../patterns/render.pattern';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { Source } from '../../discovery/sources/source';

export const propertyOrder = ['creatorId', 'timestamp', 'message', 'parentsIds', 'dataId'];

export interface CommitProperties extends LinkedProperties, RenderProperties {}

export const commitPattern = (
  source: Source,
  patternRegistry: PatternRegistry
): Pattern<Secured<Commit>, CommitProperties> => ({
  recognize: (object: Object) => propertyOrder.every(p => object.hasOwnProperty(p)),
  properties(commit: Secured<Commit>) {
    const getSoftLinks = async () => [];

    const getHardLinks = () => [commit.object.object.dataId, ...commit.object.object.parentsIds];

    const render = async () => {
      const data = await source.get(commit.object.object.dataId);

      if (!data) return null;
      const dataProps = patternRegistry.from(data) as RenderProperties;
      return dataProps.render();
    };

    return {
      ...softLinkedProperties(getSoftLinks, getHardLinks),
      render
    };
  }
});
