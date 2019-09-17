import { Pattern } from '../pattern';
import { LinkedPattern } from '../patterns/linked.pattern';
import { MenuPattern } from '../patterns/menu.pattern';
import { MenuItem } from '../../types';
import { PatternRegistry } from '../registry/pattern.registry';

export interface Node {
  links: string[];
}

export class DefaultNodePattern implements Pattern, LinkedPattern<Node>, MenuPattern {
  constructor(protected patternRegistry: PatternRegistry) {}

  recognize(object: object) {
    return object.hasOwnProperty('links') && Array.isArray(object['links']);
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

  getMenuItems(): MenuItem[] {
    return [{
      icon: 'add',
      title: 'Add child',
      action: () => {
        alert('Im clicked');
      }
    }];
  }
}
