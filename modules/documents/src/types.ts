export enum TextType {
  Title = 'Title',
  Paragraph = 'Paragraph'
}

export interface TextNode {
  text: string;
  type: TextType;
  links: string[];
}
