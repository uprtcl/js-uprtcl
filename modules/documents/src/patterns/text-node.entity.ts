import { ApolloClient } from 'apollo-boost';
import { html, TemplateResult } from 'lit-element';
import { injectable, inject, multiInject } from 'inversify';

import {
  Pattern,
  Hashed,
  Hashable,
  HasChildren,
  Entity,
  HasTitle,
} from '@uprtcl/cortex';
import {
  Mergeable,
  MergeStrategy,
  mergeStrings,
  mergeResult,
  EveesModule,
  UprtclAction
} from '@uprtcl/evees';
import { Lens, HasLenses } from '@uprtcl/lenses';
import { Logger } from '@uprtcl/micro-orchestrator';
import { NodeActions, HasDiffLenses, DiffLens } from '@uprtcl/evees';

import { TextNode, TextType, DocNodeEventsHandlers, DocNode } from '../types';
import { HasDocNodeLenses, DocNodeLens } from './document-patterns'; 

const propertyOrder = ['text', 'type', 'links'];

const logger = new Logger('TEXT-NODE-ENTITY');

const textToTextNode = (textNode: TextNode, text: string) : TextNode => {
  return {
      ...textNode,
    text: text
  };
}

const typeToTextNode = (textNode: TextNode, type: TextType) : TextNode => {
  return {
    ...textNode,
    type: type
  };
}

const nodeLevel = (node: DocNode) => {
  let level = 1;
  let parent : DocNode | undefined = node;
  parent = parent.parent;

  while (parent !== undefined) {
    level = level + 1;
    parent = parent.parent;
  }

  return level;
}

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
export class TextNodePatterns extends TextNodeEntity implements HasLenses, HasDocNodeLenses, HasDiffLenses, HasChildren, Mergeable {
  constructor(
    @inject(EveesModule.bindings.Hashed) protected hashedPattern: Pattern & Hashable<any>
  ) {
    super(hashedPattern);
  }

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  replaceChildrenLinks = (node: TextNode) => (
    childrenHashes: string[]
  ): TextNode => ({
    ...node,
    links: childrenHashes
  });

  getChildrenLinks = (node: TextNode): string[] => node.links;

  links = async (node: TextNode) => this.getChildrenLinks(node);

  lenses = (node: TextNode): Lens[] => {
    return [
      {
        name: 'documents:document',
        type: 'content',
        render: (lensContent: TemplateResult, context: any) => {
          // logger.log('lenses: documents:document - render()', { node, lensContent, context });
          return html`
            <documents-text-node
              .data=${node}
              ref=${context.ref}
              color=${context.color} 
              index=${context.index}
              .genealogy=${context.genealogy}
              toggle-action=${context.toggleAction}
              .action=${context.action}
            >
              ${lensContent}
            </documents-text-node>
          `;
        }
      }
    ];
  };

  diffLenses = (node?: TextNode): DiffLens[] => {
    return [
      {
        name: 'documents:document-diff',
        type: 'diff',
        render: (newEntity: TextNode, oldEntity: TextNode) => {
          // logger.log('lenses: documents:document - render()', { node, lensContent, context });
          return html`
            <documents-text-node-diff
              .newData=${newEntity}
              .oldData=${oldEntity}>
            </documents-text-node-diff>
          `;
        }
      }
    ];
  };

  /** lenses top is a lense that dont render the node children, leaving the job to an upper node tree controller */
  docNodeLenses = (node?: TextNode): DocNodeLens[] => {
    return [
      {
        name: 'documents:document',
        type: 'content',
        render: (node: DocNode, events: DocNodeEventsHandlers) => {
          // logger.log('lenses: documents:document - render()', { node });
          return html`
            <documents-text-node-editor
              type=${node.draft.type}
              init=${node.draft.text}
              to-append=${node.append}
              level=${nodeLevel(node)}
              editable=${node.editable ? 'true' : 'false'}
              focus-init=${node.focused}
              @focus=${events.focus}
              @blur=${events.blur}
              @content-changed=${(e) => events.contentChanged(textToTextNode(node.draft, e.detail.content), false)}
              @enter-pressed=${(e) => events.split(e.detail.content, e.detail.asChild)}
              @backspace-on-start=${(e) => events.joinBackward(e.detail.content)}
              @delete-on-end=${(e) => events.pullDownward()}
              @keyup-on-start=${events.focusBackward}
              @keydown-on-end=${events.focusDownward}
              @lift-heading=${events.lift}
              @change-type=${(e) => events.contentChanged(typeToTextNode(node.draft, e.detail.type), e.detail.lift)}
              @content-appended=${events.appended}
            >
            </documents-text-node-editor>
          `;
        }
      }
    ];
  };

  merge = (originalNode: TextNode) => async (
    modifications: TextNode[],
    mergeStrategy: MergeStrategy,
    config: any
  ): Promise<NodeActions<TextNode>> => {
    const resultText = mergeStrings(
      originalNode.text,
      modifications.map(data => data.text)
    );
    const resultType = mergeResult(
      originalNode.type,
      modifications.map(data => data.type)
    );

    const mergedLinks = await mergeStrategy.mergeLinks(
      originalNode.links,
      modifications.map(data => data.links),
      config
    );

    const allActions = ([] as UprtclAction[]).concat(...mergedLinks.map(node => node.actions));
    
    return {
      new: {
        links: mergedLinks.map(node => node.new),
        text: resultText,
        type: resultType
      },
      actions: allActions
    };
  };
}

@injectable()
export class TextNodeTitle extends TextNodeEntity implements HasTitle {
  title = (textNode: Hashed<TextNode>) => textNode.object.text;
}
