import { PatternRecognizer } from 'src/evees/elements/node_modules/src/evees/patterns/node_modules/src/evees/merge/node_modules/src/evees/behaviours/node_modules/@uprtcl/cortex';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';

export const buildRecognizer = (modules: EveesContentModule[]): PatternRecognizer => {
  const patterns = Array.prototype.concat(
    [],
    modules.map((module) => module.getPatterns())
  );
  const recognizer = new PatternRecognizer(patterns);

  // [
  //   new WikiPattern([WikiCommon, WikiLinks]),
  //   new TextNodePattern([TextNodeCommon, TextNodeTitle]),
  // ]

  return recognizer;
};
