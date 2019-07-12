import { Entity } from '../entity';
import { Dictionary } from 'lodash';

export class ContentEntity<T extends object> extends Entity<T> {
  /**
   * @returns the text contents that the object contains, by key
   */
  public getTextContents(): Dictionary<string> {
    return {};
  }
}
