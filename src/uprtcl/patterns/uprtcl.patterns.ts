import { Dictionary } from 'lodash';
import { Pattern } from '../../patterns/pattern';
import { UprtclService } from '../services/uprtcl.service';
import PatternRegistry from '../../patterns/registry/pattern.registry';
import { contextPattern } from './context.pattern';
import { perspectivePattern } from './perspective.pattern';
import { commitPattern } from './commit.pattern';
import { Secured } from '../../patterns/derive/secured.pattern';

export const uprtclPatterns = (
  uprtcl: UprtclService,
  patternRegistry: PatternRegistry
): Dictionary<Pattern<Secured<any>, any>> => ({
  context: contextPattern,
  perspective: perspectivePattern(uprtcl, patternRegistry),
  commit: commitPattern(uprtcl, patternRegistry)
});
