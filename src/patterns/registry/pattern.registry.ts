import { Dictionary } from 'lodash';
import { Pattern } from '../pattern';

export default class PatternRegistry {
  patterns: Dictionary<Pattern> = {};
  patternList: string[] = [];

  public registerPattern(name: string, pattern: Pattern): void {
    if (!this.patterns[name]) {
      this.patternList.push(name);
    }

    this.patterns[name] = pattern;
  }

  public getPattern<T extends Pattern>(name: string): T {
    const pattern = this.patterns[name];

    if (!pattern) {
      throw new Error('Pattern was not found in the registry');
    }

    return pattern as T;
  }

  public from<T>(object: object): Pattern & T {
    let pattern: Pattern = {
      recognize: () => false
    };

    for (const patternName of this.patternList) {
      if (this.patterns[patternName].recognize(object)) {
        pattern = this.applyPattern(pattern, patternName);
      }
    }

    return pattern as Pattern & T;
  }

  private applyPattern(pattern: Pattern, newPatternName: string): Pattern {
    const patternProperties = this.patterns[newPatternName];

    for (const key of Object.keys(patternProperties)) {
      pattern[key] = patternProperties;
    }

    return pattern;
  }
}
