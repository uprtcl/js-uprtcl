import { Pattern } from '../pattern';
import { LinkedPattern } from '../patterns/linked.pattern';

export interface Node {
  links: string[];
}

export class DefaultNodePattern implements Pattern, LinkedPattern<Node> {
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
}
