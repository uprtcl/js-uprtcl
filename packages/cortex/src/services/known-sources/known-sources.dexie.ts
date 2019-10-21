import { injectable } from 'inversify';
import Dexie from 'dexie';
import { KnownSourcesService } from './known-sources.service';

@injectable()
export class KnownSourcesDexie extends Dexie implements KnownSourcesService {
  knownSources: Dexie.Table<string[], string>;

  constructor() {
    super('known-sources');
    this.version(0.1).stores({
      knownSources: ''
    });
    this.knownSources = this.table('knownSources');
  }

  /**
   * @override
   */
  async ready(): Promise<void> {}

  /**
   * @override
   */
  public getKnownSources(hash: string): Promise<string[] | undefined> {
    return this.knownSources.get(hash);
  }

  /**
   * @override
   */
  public async addKnownSources(hash: string, sources: string[]): Promise<void> {
    if (!sources || sources.length === 0) {
      return;
    }

    // Merge previous sources with new sources
    const knownSources = await this.getKnownSources(hash);
    if (knownSources) {
      sources = [...sources, ...knownSources];
    }

    const newSources = new Set<string>(sources);

    await this.knownSources.put(Array.from(newSources).filter(d => d), hash);
  }

  /**
   * @override
   */
  public async removeKnownSource(hash: string, source: string): Promise<void> {
    let knownSources = await this.getKnownSources(hash);

    if (!knownSources) return;

    knownSources = knownSources.filter(s => s !== source);
    if (knownSources.length === 0) {
      await this.knownSources.delete(hash);
    } else {
      await this.knownSources.put(knownSources, hash);
    }
  }
}
