export type Constructor<T> = new (...args: any[]) => T;

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
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  dispatchEvent(event: Event): boolean;
  readonly isConnected: boolean;
}
