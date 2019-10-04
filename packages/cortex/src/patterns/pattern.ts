export interface Pattern {
  recognize: (object: object) => boolean;
}

export const forPattern = (recognize: (object: object) => boolean) =>
  class implements Pattern {
    recognize(object: object) {
      return recognize(object);
    }
  };
