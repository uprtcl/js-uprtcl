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
