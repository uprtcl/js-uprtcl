import { injectable } from 'inversify';

import { Pattern } from '../types/pattern';

@injectable()
export class PatternRecognizer {
  patterns!: Pattern<any>[];

  public recognize<T>(object: T): Pattern<T>[] {
    if (!object) {
      throw new Error('The given object was not defined');
    }

    console.log(this.patterns);

    const recognizedPatterns = this.patterns
      .filter(pattern => pattern.recognize(object))
      .map(p => ({ ...p }));

    return recognizedPatterns as Pattern<T>[];
  }
}
