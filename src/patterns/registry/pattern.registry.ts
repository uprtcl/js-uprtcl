import { Dictionary } from 'lodash';
import { Pattern, Properties } from '../pattern';

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

  public from(object: object): Properties {
    let properties: Properties = {};

    for (const patternName of this.patternList) {
      if (this.patterns[patternName].recognize(object)) {
        properties = this.applyPattern(object, properties, patternName);
      }
    }

    return properties;
  }

  private applyPattern(object: object, properties: Properties, patternName: string): Properties {
    const patternProperties = this.patterns[patternName].properties(object, properties);

    for (const key of Object.keys(patternProperties)) {
      properties[key] = patternProperties;
    }

    return properties;
  }
}
