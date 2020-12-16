export type Constructor<T, A extends Array<any> = any[]> = new (...args: A) => T;

export type Dictionary<T> = { [key: string]: T };

/**
 *  By using this `CustomElement` interface instead of `HTMLElement`, we avoid
 *  having the generated typings include most DOM API already provided by
 *  TypeScript. This is particularly useful since different versions of
 *  TypeScript may have different DOM API typings (e.g. TS 3.0.3 and TS 3.1.1).
 *  The required `isConnected` property is included to avoid the following
 *  TypeScript error:
 *      Type 'HTMLElement' has no properties in common with type 'CustomElement'.
 */
export interface CustomElement {
  connectedCallback(): void;
  disconnectedCallback?(): void;
  dispatchEvent(event: Event): boolean;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;

  readonly isConnected: boolean;
}
