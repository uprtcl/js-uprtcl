import merge from 'lodash/merge';
import { injectable, multiInject, inject } from 'inversify';
import { Pattern } from '../pattern';
import { CortexTypes, PatternFactory } from '../../types';

@injectable()
export class PatternRecognizer {
  patterns: Pattern[];

  constructor(@inject(CortexTypes.PatternFactory) patternFactory: PatternFactory) {
    console.log('hi3');
    this.patterns = patternFactory();
    console.log('hi4');
  }

  public recognizeMerge<T>(object: object): Pattern & T {
    let pattern: Pattern = {
      recognize: () => false
    };

    const recognizedPatterns = this.recognize(object);

    for (const recognizedPattern of recognizedPatterns) {
      merge(pattern, recognizedPattern);
    }

    return pattern as Pattern & T;
  }

  public recognize<T extends Array<Pattern>>(object: object): T {
    if (!object) {
      throw new Error('The given object was not defined');
    }

    const recognizedPatterns = this.patterns.filter(pattern => pattern.recognize(object));

    return recognizedPatterns as T;
  }
}
