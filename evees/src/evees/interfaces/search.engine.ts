export interface SearchEngine {
  explore(
    under: string[],
    notUnder: [],
    linksTo: string[],
    dontLinksTo: [],
    query: string,
    orderBy: string
  );
  /** inverse search, who's child is this?' */
  locate(uref: string[]): Promise<string[]>;
  otherPerspectives(perspectiveId: string): Promise<string[]>;
  proposals(perspectiveId: string): Promise<string[]>;
}
