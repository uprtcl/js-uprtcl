import { PatternRecognizer } from '../patterns/recognizer/pattern-recognizer';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';

export const buildRecognizer = (modules: Map<string, EveesContentModule>): PatternRecognizer => {
  const patterns = Array.prototype.concat(
    [],
    Array.from(modules.values()).map((module) => (module.getPatterns ? module.getPatterns() : []))
  );
  const recognizer = new PatternRecognizer(patterns);

  // [
  //   new WikiPattern([WikiCommon, WikiLinks]),
  //   new TextNodePattern([TextNodeCommon, TextNodeTitle]),
  // ]

  return recognizer;
};
