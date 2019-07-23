import { CacheService } from '../../src/services/cache/cache.service';
import { Dictionary } from 'lodash';

export class CacheSourceMock implements CacheService {
  constructor(public objects: Dictionary<any> = {}) {}

  async cache<T extends object>(hash: string, object: T): Promise<void> {
    this.objects[hash] = object;
  }

  async create<T extends object>(hash: string, object: T): Promise<string> {
    this.objects[hash] = object;
    return hash;
  }

  async get<T extends object>(hash: string): Promise<T | undefined> {
    return this.objects[hash];
  }
}
