export interface RedirectPattern<O> {
  redirect: (object: O) => Promise<string | undefined>;
}
