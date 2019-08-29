import { TypePattern, TextPattern, Pattern } from '@uprtcl/cortex';
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
