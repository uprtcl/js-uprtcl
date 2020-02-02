import { injectable } from 'inversify';

import { Pattern, Property } from '../pattern';

@injectable()
export class PatternRecognizer {
  patterns!: Pattern[];

  public recognize<T extends Array<Pattern & Property<any>>>(object: object): T {
    if (!object) {
      throw new Error('The given object was not defined');
    }

    const recognizedPatterns = this.patterns
      .filter(pattern => pattern.recognize(object))
      .map(p => ({ ...p }));

    return recognizedPatterns as T;
  }
}
