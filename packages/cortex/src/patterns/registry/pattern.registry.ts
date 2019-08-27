import { Dictionary } from 'lodash';
import * as _ from 'lodash';
import { Pattern } from '../pattern';
import { defaultPatterns } from './default.patterns';

export class PatternRegistry {
  patterns: Dictionary<Pattern> = {};
  patternList: string[] = [];

  constructor(initialPatterns: Dictionary<Pattern> = defaultPatterns) {
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

  public from<T>(object: object): Pattern & T {
    let pattern: Pattern = {
      recognize: () => false
    };

    if (!object) {
      throw new Error('The given object was not defined');
    }

    for (const patternName of this.patternList) {
      const applyingPattern = this.patterns[patternName];
      if (applyingPattern.recognize(object)) {
        _.merge(pattern, applyingPattern);
      }
    }

    return pattern as Pattern & T;
  }
}
