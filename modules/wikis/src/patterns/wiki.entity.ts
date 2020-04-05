import { html, TemplateResult } from 'lit-element';
import { injectable, inject, multiInject } from 'inversify';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Pattern, Hashed, Hashable, Entity, Creatable, HasChildren } from '@uprtcl/cortex';
import { Mergeable, EveesModule, MergeStrategy, mergeStrings, UprtclAction } from '@uprtcl/evees';
import { HasLenses, Lens } from '@uprtcl/lenses';
import { DiscoveryModule, DiscoveryService, TaskQueue, Task, Store, StoresModule } from '@uprtcl/multiplatform';
import { CidConfig } from '@uprtcl/ipfs-provider';
import { ApolloClientModule, ApolloClient } from '@uprtcl/graphql';

import { Wiki } from '../types';
import { CREATE_WIKI } from '../graphql/queries';

const propertyOrder = ['title', 'pages'];

const logger = new Logger('WIKI-ENTITY');

@injectable()
export class WikiEntity implements Entity {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>
  ) {}

  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  name = 'Wiki';
}

@injectable()
export class WikiLinks extends WikiEntity implements HasChildren, Mergeable {

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  replaceChildrenLinks = (wiki: Wiki) => (childrenHashes: string[]): Wiki => ({
    ...wiki,
    pages: childrenHashes
  });

  getChildrenLinks: (wiki: Wiki) => string[] = (wiki: Wiki): string[] =>
    wiki.pages;

  links: (wiki: Wiki) => Promise<string[]> = async (wiki: Wiki) =>
    this.getChildrenLinks(wiki);

  merge = (originalNode: Wiki) => async (
    modifications: Wiki[],
    mergeStrategy: MergeStrategy,
    config
  ): Promise<[Wiki, UprtclAction[]]> => {
    const resultTitle = mergeStrings(
      originalNode.title,
      modifications.map(data => data.title)
    );

    const [mergedPages, actions] = await mergeStrategy.mergeLinks(
      originalNode.pages,
      modifications.map(data => data.pages),
      config
    );

    return [
      {
        pages: mergedPages,
        title: resultTitle
      },
      actions
    ];
  };
}

@injectable()
export class WikiCommon extends WikiEntity implements HasLenses {
  lenses = (wiki: Hashed<Wiki>): Lens[] => {
    return [
      {
        name: 'Wiki',
        type: 'content',
        render: (lensContent: TemplateResult, context: any) => {
          logger.info('lenses() - Wiki', { wiki, lensContent, context });
          return html`
            <wiki-drawer
              .data=${wiki}
              .ref=${context.ref}
              color=${context.color}
              .selectedPageHash=${context.selectedPageHash}
            >
              ${lensContent}
            </wiki-drawer>
          `;
        }
      }
    ];
  };
}

@injectable()
export class WikiCreate extends WikiEntity implements Creatable<Partial<Wiki>, Wiki> {
  constructor(
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>,
    @multiInject(StoresModule.bindings.Store) protected stores: Array<Store>,
  ) {
    super(hashedPattern);
  }

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = () => async (wiki: Partial<Wiki>, source: string): Promise<Hashed<Wiki>> => {
    const store = this.stores.find(s => s.source === source);
    if (!store) throw new Error(`store for ${source} not found`);

    const hashedWiki = await this.new()(wiki, store.hashRecipe);
    const result = await this.client.mutate({
      mutation: CREATE_WIKI,
      variables: {
        content: hashedWiki.object,
        source
      }
    });
    // TODO: Comment this
    if (result.data.createWiki.id != hashedWiki.id) {
      throw new Error('unexpected id');
    }

    return { id: result.data.createWiki.id, object: hashedWiki.object };
  };

  new = () => async (node: Partial<Wiki>, config: CidConfig): Promise<Hashed<Wiki>> => {
    const pages = node && node.pages ? node.pages : [];
    const title = node && node.title ? node.title : '';

    const newWiki = { pages, title };

    return this.hashedPattern.derive()(newWiki, config);
  };
}
