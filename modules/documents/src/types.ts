export enum TextType {
  title,
  paragraph
}

export interface TypedText {
  text: string;
  type: TextType;
}
