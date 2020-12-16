import { html } from 'lit-element';
import { injectable } from 'inversify';

import {
  Pattern,
  recognizeEntity,
  HasChildren,
  Entity,
  HasTitle,
  New,
} from '@uprtcl/cortex';
import {
  Merge,
  MergeStrategy,
  mergeStrings,
  mergeResult,
  HasDiffLenses,
  DiffLens,
  EveesWorkspace,
} from '@uprtcl/evees';
import { Lens, HasLenses } from '@uprtcl/lenses';

import { TextNode, TextType, DocNode, DocNodeEventsHandlers } from '../types';
import { DocNodeLens } from './document-patterns';
import { DocumentsBindings } from '../bindings';

const propertyOrder = ['text', 'type', 'links'];

const textToTextNode = (textNode: TextNode, text: string): TextNode => {
  return {
    ...textNode,
    text: text,
  };
};

const typeToTextNode = (textNode: TextNode, type: TextType): TextNode => {
  return {
    ...textNode,
    type: type,
  };
};

export class TextNodePattern extends Pattern<Entity<TextNode>> {
  recognize(entity: object): boolean {
    return (
      recognizeEntity(entity) &&
      propertyOrder.every((p) => entity.object.hasOwnProperty(p))
    );
  }

  type = DocumentsBindings.TextNodeType;
}

@injectable()
export class TextNodeCommon
  implements
    HasLenses<Entity<TextNode>>,
    HasChildren<Entity<TextNode>>,
    Merge<Entity<TextNode>> {
  replaceChildrenLinks = (node: Entity<TextNode>) => (
    childrenHashes: string[]
  ): Entity<TextNode> => ({
    id: '',
    object: {
      ...node.object,
      links: childrenHashes,
    },
  });

  getChildrenLinks = (node: Entity<TextNode>): string[] => node.object.links;

  links = async (node: Entity<TextNode>) => this.getChildrenLinks(node);

  lenses = (node: Entity<TextNode>): Lens[] => {
    return [
      {
        name: 'documents:document',
        type: 'content',
        render: (entity: Entity<any>, context: any) => {
          return html`
            <documents-text-node .data=${node} uref=${entity.id}>
            </documents-text-node>
          `;
        },
      },
    ];
  };

  /** lenses top is a lense that dont render the node children, leaving the job to an upper node tree controller */
  docNodeLenses = (): DocNodeLens[] => {
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
              level=${node.level + 1}
              editable=${node.editable ? 'true' : 'false'}
              focus-init=${node.focused}
              .canConvertTo=${node.canConvertTo}
              @focus=${events.focus}
              @clicked-outside=${events.blur}
              @content-changed=${(e) =>
                events.contentChanged(
                  textToTextNode(node.draft, e.detail.content),
                  false
                )}
              @enter-pressed=${(e) =>
                events.split(e.detail.content, e.detail.asChild)}
              @backspace-on-start=${(e) =>
                events.joinBackward(e.detail.content)}
              @delete-on-end=${(e) => events.pullDownward()}
              @keyup-on-start=${events.focusBackward}
              @keydown-on-end=${events.focusDownward}
              @lift-heading=${events.lift}
              @change-type=${(e) =>
                events.contentChanged(
                  typeToTextNode(node.draft, e.detail.type),
                  e.detail.lift
                )}
              @content-appended=${events.appended}
              @convert-to=${(e) => events.convertedTo(e.detail.type)}
            >
            </documents-text-node-editor>
          `;
        },
      },
    ];
  };

  merge = (originalNode: Entity<TextNode>) => async (
    modifications: Entity<TextNode>[],
    mergeStrategy: MergeStrategy,
    workspace: EveesWorkspace,
    config: any
  ): Promise<TextNode> => {
    const resultText = modifications[1].object.text;
    const resultType = mergeResult(
      originalNode.object.type,
      modifications.map((data) => data.object.type)
    );

    const mergedLinks = await mergeStrategy.mergeLinks(
      originalNode.object.links,
      modifications.map((data) => data.object.links),
      workspace,
      config
    );

    return {
      text: resultText,
      type: resultType,
      links: mergedLinks,
    };
  };
}

@injectable()
export class TextNodeTitle implements HasTitle, HasDiffLenses {
  title = (textNode: Entity<TextNode>) => textNode.object.text;

  diffLenses = (node?: TextNode): DiffLens[] => {
    return [
      {
        name: 'documents:document-diff',
        type: 'diff',
        render: (
          workspace: EveesWorkspace,
          newEntity: Entity<TextNode>,
          oldEntity: Entity<TextNode>,
          summary: boolean
        ) => {
          // logger.log('lenses: documents:document - render()', { node, lensContent, context });
          return html`
            <documents-text-node-diff
              .workspace=${workspace}
              .newData=${newEntity}
              .oldData=${oldEntity}
              ?summary=${summary}
            >
            </documents-text-node-diff>
          `;
        },
      },
    ];
  };
}
