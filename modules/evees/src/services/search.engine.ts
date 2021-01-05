export interface SearchEngine {
  otherPerspectives(perspectiveId: string): Promise<string[]>;
  explore(
    under: string[],
    notUnder: [],
    linksTo: string[],
    dontLinksTo: [],
    query: string,
    orderBy: string
  );
  locate(uref: string[]): Promise<string[]>;
  proposals(perspectiveId: string): Promise<string[]>;
}
