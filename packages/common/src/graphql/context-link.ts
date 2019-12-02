import { interfaces } from 'inversify';
import { setContext } from 'apollo-link-context';

export function contextContainerLink(container: interfaces.Container) {
  return setContext(() => ({
    container
  }));
}
