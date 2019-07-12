import { Implementation } from './types';

export default class ImplementationRegistry {
  implementations: Array<Implementation<any>> = [];

  registerImplementation<T extends object>(implementation: Implementation<T>) {
    this.implementations[name] = implementation;
  }

  from<T extends object>(object: T): Implementation<T> {
    const implementations = this.implementations.filter(impl => impl.implements(object));

    return this.compose<T>(implementations);
  }

  compose<T extends object>(implementations: Array<Implementation<T>>): Implementation<T> {
    const impl: Implementation<T> = {
      implements: () => false
    };

    for (const implementation of implementations) {
      for (const key of Object.keys(implementation)) {
        impl[key] = implementation[key];
      }
    }

    return impl;
  }
}
