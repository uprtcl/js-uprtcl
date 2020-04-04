import { Hashed, HasChildren } from "@uprtcl/cortex";
import { HasDocNodeLenses } from "./patterns/document-patterns";

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
  ref: string,
  authority: string,
  data?: Hashed<any>,
  draft: any,
  append?: any,              // used by upper layer to tell the docnode lense to append content using its internal appending logic.
  childrenNodes: DocNode[],
  symbol: symbol,
  headId?: string,
  editable: boolean,
  parent?: DocNode,
  ix?: number,              // ix on parent
  focused: boolean,
  hasDocNodeLenses: HasDocNodeLenses,
  hasChildren: HasChildren
}

export interface DocNodeEventsHandlers {
  focus: () => void,
  blur: () => void,
  contentChanged: (newContent: any) => void,
  split: (tail: string, asChild: boolean) => void,
  joinBackward: (tail: string) => void,
  focusBackward: () => void,
  focusDownward: () => void,
  lift: () => void,
  push: () => void,
  appended: () => void
}

