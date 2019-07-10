import { LinkedEntity } from './linked.entity';
import { Hashed } from '../types';

export class HashedEntity<T extends object> extends LinkedEntity<Hashed<T>> {
  setupObject(object: any): Hashed<T> {
    return {
      id: this.hash(object),
      object: object
    };
  }

  hash(object: any): string {
    return '';
  }

  /**
   * @override
   */
  public async getLinks(): Promise<string[]> {
    const softLinks = await this.getSoftLinks();
    return this.getHardLinks().concat(softLinks);
  }

  /**
   * @returns the hard links contained in the object, that can't change
   */
  public getHardLinks(): string[] {
    return [];
  }

  /**
   * @returns the soft links that can change throughout the object lifecycle
   */
  public async getSoftLinks(): Promise<string[]> {
    return [];
  }

  public validateHash(): boolean {
    return true;
  }
}
