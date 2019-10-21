import { injectable } from 'inversify';

export interface Pattern {
  recognize: (object: object) => boolean;
}

export const forPattern = (
  recognize: (object: object) => boolean
): new (...args: any[]) => Pattern => {
  @injectable()
  class Base implements Pattern {
    recognize(object: object) {
      return recognize(object);
    }
  }

  return Base;
};
