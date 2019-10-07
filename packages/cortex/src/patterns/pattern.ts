import { injectable } from 'inversify';

export interface Pattern {
  recognize: (object: object) => boolean;
}

export const forPattern = (recognize: (object: object) => boolean): any => {
  @injectable()
  class Base implements Pattern {
    recognize(object: object) {
      return recognize(object);
    }
  }

  return Base;
};
