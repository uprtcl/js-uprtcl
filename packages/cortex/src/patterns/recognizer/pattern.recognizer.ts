import { merge, assignIn, cloneDeep } from 'lodash';
import { injectable } from 'inversify';

import { Pattern, Property } from '../pattern';

window['merge'] = merge;
window['assignIn'] = assignIn;

@injectable()
export class PatternRecognizer {
  patterns!: Pattern[];

  public recognize<T extends Array<Pattern>>(object: object): T {
    if (!object) {
      debugger
      throw new Error('The given object was not defined');
    }

    const recognizedPatterns = this.patterns.filter(pattern => pattern.recognize(object)).map(cloneDeep);

    return recognizedPatterns as T;
  }

  public recognizeProperties<P extends Property<any>>(
    object: object,
    propChecker: (prop: P) => boolean
  ): Array<P> {
    const patterns: P[] = (this.recognize(object) as unknown) as P[];

    return (patterns.filter(prop => propChecker(prop as P)) as unknown) as P[];
  }

  public recognizeUniqueProperty<P extends Property<any>>(
    object: object,
    propChecker: (prop: P) => boolean
  ): P | undefined {
    const properties = this.recognizeProperties(object, propChecker);

    if (properties.length > 1) {
      throw new Error(
        `Ambiguous property: object ${object.toString()} implements more than once the required unique property`
      );
    }

    return properties.length > 0 ? properties[0] : undefined;
  }
}
