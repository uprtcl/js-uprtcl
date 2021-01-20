import { PatternRecognizer } from '../patterns/recognizer/pattern-recognizer';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { PerspectivePattern } from 'src/evees/patterns/perspective.pattern';
import { CommitPattern } from 'src/evees/patterns/commit.pattern';

export const buildRecognizer = (modules: Map<string, EveesContentModule>): PatternRecognizer => {
  const eveesPatterns = [new CommitPattern(), new PerspectivePattern()];
  const patterns = Array.prototype.concat(
    eveesPatterns,
    Array.from(modules.values()).map((module) => (module.getPatterns ? module.getPatterns() : []))
  );
  const recognizer = new PatternRecognizer(Array.prototype.concat([], ...patterns));

  return recognizer;
};
