export interface HasRedirect {
  redirect: (object: any) => Promise<string | undefined>;
}
