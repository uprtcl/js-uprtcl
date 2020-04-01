import { Hashed, HasChildren } from "@uprtcl/cortex";
import { DocNodeLens } from "./patterns/document-patterns";

export enum TextType {
  Title = 'Title',
  Paragraph = 'Paragraph'
}

export interface TextNode {
  text: string;
  type: TextType;
  links: string[];
}

export interface DocNode {
  path: number[],
  ref: string,
  authority: string,
  data: Hashed<any>,
  docNodeLenses: DocNodeLens[],
  editable: boolean,
  hasChildren: HasChildren,
  parent?: DocNode,
  childrenNodes: DocNode[],
  focused: boolean
}

export interface DocNodeEventsHandlers {
  focus: () => void,
  blur: () => void,
  contentChanged: (newContent: any) => void,
  split: (tail: string) => void,
  joinBackward: (tail: string) => void,
  focusBackward: () => void,
  focusDownward: () => void,
  lift: () => void,
  push: () => void
}

