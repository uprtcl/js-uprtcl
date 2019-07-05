import { LinkedEntity } from './linked.entity';


export class ContentAddressableEntity<T extends object> extends LinkedEntity<T> {

  /**
   * @override
   */
  public getLinks(): string[] {
    return this.getHardLinks().concat(this.getSoftLinks());
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
  public getSoftLinks(): string[] {    
    return [];
  }
}