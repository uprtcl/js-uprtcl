import { Properties, Pattern } from './pattern';

export interface RenderProperties extends Properties {
  render: () => Promise<any>;
}

export const renderPattern: Pattern<any, RenderProperties> = {
  recognize: () => true,
  properties(object: any) {
    return { render: () => Promise.resolve(object) };
  }
};
