import { Pattern } from '../pattern';
import { LinkedPattern } from '../patterns/linked.pattern';
import { ActionsPattern } from '../patterns/actions.pattern';
import { PatternAction } from '../../types';

export interface Node {
  links: string[];
}

export class DefaultNodePattern implements Pattern, LinkedPattern<Node>, ActionsPattern {
  recognize(object: object) {
    return (object as Node).links && Array.isArray((object as Node).links);
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
