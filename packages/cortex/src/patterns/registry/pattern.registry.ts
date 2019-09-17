import { Dictionary } from 'lodash';
import merge from 'lodash/merge';
import { Pattern } from '../pattern';

export class PatternRegistry {
  patterns: Dictionary<Pattern> = {};
  patternList: string[] = [];

  constructor(initialPatterns: Dictionary<Pattern> = {}) {
    for (const name of Object.keys(initialPatterns)) {
      this.registerPattern(name, initialPatterns[name]);
    }
  }

  public registerPattern(name: string, pattern: Pattern): void {
    if (!this.patterns[name]) {
      this.patternList.push(name);
    }

    this.patterns[name] = pattern;
  }

  public getPattern<T>(name: string): T {
    const pattern = this.patterns[name];

    if (!pattern) {
      throw new Error('Pattern was not found in the registry');
    }

    return (pattern as unknown) as T;
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

    const recognizedPatterns = this.patternList
      .filter(patternName => {
        const applyingPattern = this.patterns[patternName];
        return applyingPattern.recognize(object);
      })
      .map(patternName => this.patterns[patternName]);

    return recognizedPatterns as T;
  }
}
