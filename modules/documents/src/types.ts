import { Node } from '@uprtcl/cortex';

export enum TextType {
  title,
  paragraph
}

export interface TypedText {
  text: string;
  type: TextType;
}

export type TextNode = TypedText & Node;
