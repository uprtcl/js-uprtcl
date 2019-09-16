import { Node } from '@uprtcl/cortex';

export enum TextType {
  Title = 'Title',
  Paragraph = 'Paragraph'
}

export interface TypedText {
  text: string;
  type: TextType;
}

export type TextNode = TypedText & Node;
