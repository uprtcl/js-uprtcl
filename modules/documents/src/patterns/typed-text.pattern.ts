import { Pattern } from '../../../../packages/core/src/patterns/pattern';
import { TypePattern } from '../../../../packages/common/src/patterns/type.pattern';
import { TextPattern } from '../../../../packages/common/src/patterns/text.pattern';
import { TextType, TypedText } from '../types';

export class TypedTextPattern implements Pattern, TextPattern, TypePattern<TextType> {
  recognize(object: object): boolean {
    return object.hasOwnProperty('text') && object.hasOwnProperty('type');
  }

  getType(object: TypedText): TextType {
    return object.type;
  }

  getText(object: TypedText): string {
    return object.text;
  }
}
