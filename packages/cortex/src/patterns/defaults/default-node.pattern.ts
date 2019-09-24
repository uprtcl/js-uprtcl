import { Pattern } from '../pattern';
import { LinkedPattern } from '../patterns/linked.pattern';
import { ActionsPattern } from '../patterns/actions.pattern';
import { PatternAction } from '../../types';
import { HashedPattern, Hashed } from '../patterns/hashed.pattern';

export interface Node {
  links: string[];
}

export class DefaultNodePattern implements Pattern, LinkedPattern<Node>, ActionsPattern {
  constructor(protected hashedPattern: Pattern & HashedPattern<Node>) {}

  recognize(object: object) {
    return (
      this.hashedPattern.recognize(object) &&
      this.hashedPattern.extract(object as Hashed<Node>) &&
      Array.isArray(this.hashedPattern.extract(object as Hashed<Node>))
    );
  }

  async getLinks(object: Node): Promise<string[]> {
    const softLinks = await this.getSoftLinks(object);
    return softLinks.concat(this.getHardLinks(object));
  }

  async getSoftLinks(object: Node): Promise<string[]> {
    return [];
  }

  getHardLinks(object: Node): string[] {
    return object.links;
  }

  getActions(): PatternAction[] {
    return [
      {
        icon: 'add',
        title: 'Add child',
        action: () => {
          alert('Im clicked');
        }
      }
    ];
  }
}
