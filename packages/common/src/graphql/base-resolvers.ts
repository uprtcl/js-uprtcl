
export const baseResolvers = {
  Entity: {
    id(parent) {
      return parent.id ? parent.id : parent;
    },
    _context(parent) {
      return parent;
    }
  }
};
