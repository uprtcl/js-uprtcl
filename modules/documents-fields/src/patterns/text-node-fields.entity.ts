import { ApolloClient } from 'apollo-boost';
import { html, TemplateResult } from 'lit-element';
import { injectable, inject, multiInject } from 'inversify';

import {
  Pattern,
  Hashed,
  Hashable,
  Creatable,
  HasChildren,
  Entity,
  HasTitle,
  Newable
} from '@uprtcl/cortex';
import { DiscoveryService, DiscoveryModule, TaskQueue, Task, Store } from '@uprtcl/multiplatform';
import {
  Mergeable,
  MergeStrategy,
  mergeStrings,
  mergeResult,
  EveesModule,
  UprtclAction
} from '@uprtcl/evees';
import { Lens, HasLenses } from '@uprtcl/lenses';
import { ApolloClientModule } from '@uprtcl/graphql';
import { StoresModule } from '@uprtcl/multiplatform';
import { Logger } from '@uprtcl/micro-orchestrator';
import { TextType } from "@uprtcl/documents";

import { TextNodeFields } from '../types';
import { CidConfig } from '@uprtcl/ipfs-provider';
import { CREATE_TEXT_FIELDS_NODE } from '../graphql/queries';

const propertyOrder = ['text', 'type', 'links', 'fields'];

const logger = new Logger('TEXT-NODE-ENTITY');

@injectable()
export class TextNodeFieldsEntity implements Entity {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>
  ) {}
  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  name = 'TextNodeFields';
}

@injectable()
export class TextNodeFieldsPatterns extends TextNodeFieldsEntity implements HasLenses, HasChildren, Mergeable {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>
  ) {
    super(hashedPattern);
  }

  replaceChildrenLinks = (node: Hashed<TextNodeFields>) => (
    childrenHashes: string[]
  ): Hashed<TextNodeFields> => ({
    id: '',
    object: {
      ...node.object,
      links: childrenHashes
    }
  });

  getChildrenLinks = (node: Hashed<TextNodeFields>): string[] => node.object.links;

  links = async (node: Hashed<TextNodeFields>) => this.getChildrenLinks(node);

  lenses = (node: Hashed<TextNodeFields>): Lens[] => {
    return [
      {
        name: 'documents:document-fields',
        type: 'content', // HEY! how can I give priority to this guy?
        render: (lensContent: TemplateResult, context: any) => {
          return html`
            <documents-text-node-fields
              .data=${node}
              ref=${context.ref}
              color=${context.color} 
              index=${context.index}
              .genealogy=${context.genealogy}
              toggle-action=${context.toggleAction}
              .action=${context.action}
            >
              ${lensContent}
            </documents-text-node-fields>
          `;
        }
      }
    ];
  };

  merge = (originalNode: Hashed<TextNodeFields>) => async (
    modifications: Hashed<TextNodeFields>[],
    mergeStrategy: MergeStrategy,
    config: any
  ): Promise<[TextNodeFields, UprtclAction[]]> => {
    const resultText = mergeStrings(
      originalNode.object.text,
      modifications.map(data => data.object.text)
    );
    const resultType = mergeResult(
      originalNode.object.type,
      modifications.map(data => data.object.type)
    );

    const [mergedLinks, actions] = await mergeStrategy.mergeLinks(
      originalNode.object.links,
      modifications.map(data => data.object.links),
      config
    );

    // TODO merge fields ! :)
    const mergedFields = originalNode.object.fields;

    return [
      {
        links: mergedLinks,
        text: resultText,
        type: resultType,
        fields: mergedFields,
      },
      actions
    ];
  };
}

@injectable()
export class TextNodeFieldsCreate extends TextNodeFieldsEntity
  implements Creatable<Partial<TextNodeFields>, TextNodeFields>, Newable<Partial<TextNodeFields>, TextNodeFields> {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(DiscoveryModule.bindings.TaskQueue) protected taskQueue: TaskQueue,
    @multiInject(StoresModule.bindings.Store) protected stores: Array<Store>,
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>
  ) {
    super(hashedPattern);
  }

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = () => async (
    node: Partial<TextNodeFields> | undefined,
    source: string
  ): Promise<Hashed<TextNodeFields>> => {
    const store = this.stores.find(s => s.source === source);
    if (!store) throw new Error(`store for ${source} not found`);

    const textNode = await this.new()(node, store.hashRecipe);
    const result = await this.client.mutate({
      mutation: CREATE_TEXT_FIELDS_NODE,
      variables: {
        content: textNode.object,
        source
      }
    });

    if (result.data.createTextNode.id != textNode.id) {
      throw new Error('unexpected id');
    }

    return textNode;
  };

  new = () => async (
    node: Partial<TextNodeFields> | undefined,
    recipe: CidConfig
  ): Promise<Hashed<TextNodeFields>> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    const newTextNode = { links, text, type };
    return this.hashedPattern.derive()(newTextNode, recipe);
  };
}

@injectable()
export class TextNodeFieldsTitle extends TextNodeFieldsEntity implements HasTitle {
  title = (textNode: Hashed<TextNodeFields>) => textNode.object.text;
}
