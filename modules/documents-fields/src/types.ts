import { TextType } from "@uprtcl/documents";

export interface NodeField {
  id: string;
  value: any;
}

export interface TextNodeFields {
  text: string;
  type: TextType;
  links: string[];
  fields: NodeField[];
}
