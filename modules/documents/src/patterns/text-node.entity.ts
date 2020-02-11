import { ApolloClient } from 'apollo-boost';
import { html, TemplateResult } from 'lit-element';
import { injectable, inject, multiInject } from 'inversify';

import {
  Pattern,
  HasActions,
  PatternAction,
  Hashed,
  Hashable,
  Creatable,
  PatternRecognizer,
  HasChildren,
  Entity,
  HasTitle,
  CortexModule,
  Newable
} from '@uprtcl/cortex';
import { DiscoveryService, DiscoveryModule, TaskQueue, Task } from '@uprtcl/multiplatform';
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

import { TextNode, TextType } from '../types';
import { DocumentsBindings } from '../bindings';
import { DocumentsProvider } from '../services/documents.provider';
import { CREATE_TEXT_NODE } from '../graphql/queries';
import { CidConfig } from '@uprtcl/ipfs-provider';

const propertyOrder = ['text', 'type', 'links'];

@injectable()
export class TextNodeEntity implements Entity {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>
  ) {}
  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  name = 'TextNode';
}

@injectable()
export class TextNodePatterns extends TextNodeEntity implements HasLenses, HasChildren, Mergeable {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>
  ) {
    super(hashedPattern);
  }

  replaceChildrenLinks = (node: Hashed<TextNode>) => (
    childrenHashes: string[]
  ): Hashed<TextNode> => ({
    id: '',
    object: {
      ...node.object,
      links: childrenHashes
    }
  });

  getChildrenLinks = (node: Hashed<TextNode>): string[] => node.object.links;

  links = async (node: Hashed<TextNode>) => this.getChildrenLinks(node);

  lenses = (node: Hashed<TextNode>): Lens[] => {
    return [
      {
        name: 'documents:document',
        type: 'content',
        render: (lensContent: TemplateResult, context: any) => {
          return html`
            <documents-text-node
              .data=${node}
              .perspective=${context.perspective}
              color=${context.color}
              only-children=${context.onlyChildren}
              level=${context.level}
              index=${context.index}
              .genealogy=${context.genealogy}
            >
              ${lensContent}
            </documents-text-node>
          `;
        }
      }
    ];
  };

  merge = (originalNode: Hashed<TextNode>) => async (
    modifications: Hashed<TextNode>[],
    mergeStrategy: MergeStrategy,
    config: any
  ): Promise<[TextNode, UprtclAction[]]> => {
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

    return [
      {
        links: mergedLinks,
        text: resultText,
        type: resultType
      },
      actions
    ];
  };
}

@injectable()
export class TextNodeActions extends TextNodeEntity implements HasActions {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(CortexModule.bindings.Recognizer) protected recognizer: PatternRecognizer
  ) {
    super(hashedPattern);
  }

  actions = (node: Hashed<TextNode>): PatternAction[] => {
    const textNode = node.object;

    if (textNode.type === TextType.Paragraph) {
      return [
        {
          icon: 'title',
          title: 'documents:to_title',
          action: (changeContent: (newContent: any) => void) => {
            changeContent({ ...textNode, type: TextType.Title });
          },
          type: 'formatting'
        }
      ];
    } else {
      return [
        {
          icon: 'text_fields',
          title: 'documents:to_paragraph',
          action: (changeContent: (newContent: any) => void) => {
            changeContent({ ...textNode, type: TextType.Paragraph });
          },
          type: 'formatting'
        }
      ];
    }
  };
}

@injectable()
export class TextNodeCreate extends TextNodeEntity
  implements Creatable<Partial<TextNode>, TextNode>, Newable<Partial<TextNode>, TextNode> {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(DiscoveryModule.bindings.DiscoveryService) protected discovery: DiscoveryService,
    @inject(DiscoveryModule.bindings.TaskQueue) protected taskQueue: TaskQueue,
    @multiInject(DocumentsBindings.DocumentsRemote) protected documentsRemotes: DocumentsProvider[],
    @inject(ApolloClientModule.bindings.Client) protected client: ApolloClient<any>
  ) {
    super(hashedPattern);
  }

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = () => async (
    node: Partial<TextNode> | undefined,
    source: string
  ): Promise<Hashed<TextNode>> => {
    const sourceDep = this.documentsRemotes.find(s => s.source === source);
    if (!sourceDep) throw new Error(`source connection for ${source} not found`);

    const textNode = await this.new()(node, sourceDep.hashRecipe);
    const result = await this.client.mutate({
      mutation: CREATE_TEXT_NODE,
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
    node: Partial<TextNode> | undefined,
    recipe: CidConfig
  ): Promise<Hashed<TextNode>> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    const newTextNode = { links, text, type };
    return this.hashedPattern.derive()(newTextNode, recipe);
  };
}

@injectable()
export class TextNodeTitle extends TextNodeEntity implements HasTitle {
  title = (textNode: Hashed<TextNode>) => textNode.object.text;
}
