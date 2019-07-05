import { Entity } from './entity';
import { Dictionary } from '../types';


export class LinkedEntity<T extends object> extends Entity<T> {

  /**
   * @returns the text contents that the object contains, by key
   */
  public getTextContents(): Dictionary<string> {
    return {};
  }

  /**
   * @returns the links that the object points to
   */
  public getLinks(): string[] {
    return [];
  }
}