import { html } from 'lit-element';

import {
  mergeResult,
  HasDiffLenses,
  HasLenses,
  DiffLens,
  MergeConfig,
  Pattern,
  HasChildren,
  HasTitle,
  HasEmpty,
  Lens,
  Evees,
  LinkingBehaviorNames,
  HasMerge,
  MergingBehaviorNames,
  RenderEntityInput,
  MergeStrategy,
} from '@uprtcl/evees';

import { TextNode, TextType, DocNode, DocNodeEventsHandlers } from '../types';
import { DocumentsBindings } from '../bindings';
import { htmlToText } from '../support/documents.support';

import { DocNodeLens } from './document-patterns';

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

export class TextNodePattern extends Pattern<TextNode> {
  recognize(object: any): boolean {
    return propertyOrder.every((p) => object.hasOwnProperty(p));
  }

  type = DocumentsBindings.TextNodeType;
}

export class TextNodeCommon
  implements
    HasLenses<TextNode, RenderEntityInput>,
    HasChildren<TextNode>,
    HasMerge<TextNode>,
    HasEmpty<TextNode> {
  [LinkingBehaviorNames.REPLACE_CHILDREN] = (node: TextNode) => (
    childrenHashes: string[]
  ): TextNode => ({
    ...node,
    links: childrenHashes,
  });

  [LinkingBehaviorNames.CHILDREN] = (node: TextNode): string[] => node.links;

  empty = (): TextNode => {
    return { text: '', type: TextType.Title, links: [] };
  };

  text = (node: TextNode): string => node.text;

  lenses = (node: TextNode): Lens<RenderEntityInput>[] => {
    return [
      {
        name: 'documents:document',
        type: 'content',
        render: (input: RenderEntityInput, evees?: Evees) => {
          return html`<documents-editor
            uref=${input.uref}
            ?read-only=${input.readOnly}
            .localEvees=${evees}
          ></documents-editor>`;
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
                events.contentChanged(textToTextNode(node.draft, e.detail.content), false)}
              @enter-pressed=${(e) => events.split(e.detail.content, e.detail.asChild)}
              @backspace-on-start=${(e) => events.joinBackward(e.detail.content)}
              @delete-on-end=${(e) => events.pullDownward()}
              @keyup-on-start=${events.focusBackward}
              @keydown-on-end=${events.focusDownward}
              @lift-heading=${events.lift}
              @change-type=${(e) =>
                events.contentChanged(typeToTextNode(node.draft, e.detail.type), e.detail.lift)}
              @content-appended=${events.appended}
              @convert-to=${(e) => events.convertedTo(e.detail.type)}
            >
            </documents-text-node-editor>
          `;
        },
      },
    ];
  };

  [MergingBehaviorNames.MERGE] = (originalNode: TextNode) => async (
    modifications: TextNode[],
    merger: MergeStrategy,
    config: MergeConfig
  ): Promise<TextNode> => {
    const resultText = modifications[1].text;
    const resultType = mergeResult(
      originalNode.type,
      modifications.map((data) => data.type)
    );

    if (!merger.mergeChildren) throw new Error('mergeChildren function not found in merger');

    const mergedLinks = await merger.mergeChildren(
      originalNode.links,
      modifications.map((data) => data.links),
      config
    );

    return {
      text: resultText,
      type: resultType,
      links: mergedLinks,
    };
  };
}

export class TextNodeTitle implements HasTitle, HasDiffLenses {
  title = (textNode: TextNode) => {
    return htmlToText(textNode.text);
  };

  diffLenses = (node?: TextNode): DiffLens[] => {
    return [
      {
        name: 'documents:document-diff',
        type: 'diff',
        render: (evees: Evees, newEntity: TextNode, oldEntity: TextNode, summary: boolean) => {
          // logger.log('lenses: documents:document - render()', { node, lensContent, context });
          return html`
            <documents-text-node-diff
              .evees=${evees}
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
