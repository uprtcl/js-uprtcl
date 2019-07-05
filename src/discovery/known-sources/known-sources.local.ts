import { KnownSourcesService } from './known-sources.service';
import Dexie from 'dexie';

export class KnownSourcesLocal extends Dexie implements KnownSourcesService {
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
  public getOwnSource(): Promise<string> {
    return Promise.resolve('local');
  }

  /**
   * @override
   */
  public getKnownSources(hash: string): Promise<string[]> {
    return this.knownSources.get(hash);
  }

  /**
   * @override
   */
  public async addKnownSources(hash: string, sources: string[]): Promise<void> {
    if (!sources || sources.length === 0) {
      return;
    }

    const knownSources = await this.getKnownSources(hash);
    const newSources = new Set<string>([...sources, ...knownSources]);

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
