import { forPattern } from '../pattern';
import { HasLinks } from '../properties/has-links';
import { HasActions } from '../properties/has-actions';
import { PatternAction } from '../../types';
import { injectable } from 'inversify';

export interface Node {
  links: string[];
}

export function nodePattern(object: object) {
  return (object as Node).links && Array.isArray((object as Node).links);
}

@injectable()
export class NodeLinksPattern extends forPattern(nodePattern) implements HasLinks {
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
}

@injectable()
export class NodeActions extends forPattern(nodePattern) implements HasActions {
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
