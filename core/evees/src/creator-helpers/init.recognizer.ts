import { PatternRecognizer } from '../patterns/recognizer/pattern-recognizer';
import { EveesContentModule } from '../evees/interfaces/evees.content.module';
import { PerspectivePattern } from '../evees/patterns/perspective.pattern';
import { CommitPattern } from '../evees/patterns/commit.pattern';
import { Pattern } from 'src/patterns/interfaces/pattern';

export const initRecognizer = (
  modules: Map<string, EveesContentModule>,
  addPatterns: Pattern<any>[] = []
): PatternRecognizer => {
  const eveesPatterns = [new CommitPattern(), new PerspectivePattern()];
  const patterns = Array.prototype.concat(
    eveesPatterns,
    addPatterns,
    ...Array.from(modules.values()).map((module) =>
      module.getPatterns ? module.getPatterns() : []
    )
  );
  const recognizer = new PatternRecognizer(Array.prototype.concat([], ...patterns));

  return recognizer;
};
