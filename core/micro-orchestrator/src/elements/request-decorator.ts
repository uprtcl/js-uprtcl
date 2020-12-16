import { ConnectedElement } from './module-connect.mixin';
import { interfaces } from 'inversify';
import { CustomElement } from '../types';
import { RequestDependencyOptions } from './module-container';

export const request = (
  dependency: interfaces.ServiceIdentifier<any>,
  options?: RequestDependencyOptions
) => {
  return function (target: CustomElement & ConnectedElement, propertyKey: string) {
    if (!target.request) throw new Error('Cannot request dependencies without using moduleConnect');

    const callback = target.connectedCallback;

    target.connectedCallback = function () {
      callback.call(this);
      let value;
      Object.defineProperty(target, propertyKey, {
        get: () => {
          if (!value) {
            if (options && options.multiple) {
              value = target.requestAll.call(this, dependency, options);
            } else {
              value = target.request.call(this, dependency, options);
            }
          }
          return value;
        },
      });
    };
  };
};
