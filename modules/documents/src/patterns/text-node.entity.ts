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
  CortexModule
} from '@uprtcl/cortex';
import { CorePatterns } from '@uprtcl/common';
import { Mergeable, MergeStrategy, mergeStrings, mergeResult } from '@uprtcl/evees';
import { Lens, HasLenses } from '@uprtcl/lenses';
import { EveesModule } from '@uprtcl/evees';

import { TextNode, TextType, DocumentsTypes } from '../types';
import { Documents } from '../services/documents';

const propertyOrder = ['text', 'type', 'links'];

@injectable()
export class TextNodeEntity implements Entity {
  constructor(@inject(CorePatterns.Hashed) protected hashedPattern: Pattern & Hashable<any>) {}
  recognize(object: object): boolean {
    if (!this.hashedPattern.recognize(object)) return false;

    const node = this.hashedPattern.extract(object as Hashed<any>);
    return propertyOrder.every(p => node.hasOwnProperty(p));
  }

  name = 'TextNode';
}

@injectable()
export class TextNodePatterns extends TextNodeEntity implements HasLenses, HasChildren, Mergeable {
  constructor(@inject(CorePatterns.Hashed) protected hashedPattern: Pattern & Hashable<any>) {
    super(hashedPattern);
  }

  replaceChildrenLinks = (node: Hashed<TextNode>) => (
    childrenHashes: string[]
  ): Hashed<TextNode> => ({
    ...node,
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
          console.log('[DOCUMENT-ENTITY] render()', {node, context});
          return html`
            <documents-text-node
              .data=${node}
              .perspective=${context.perspective}
              color=${context.color}
              only-children=${context.onlyChildren}
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
    mergeStrategy: MergeStrategy
  ): Promise<TextNode> => {
    const resultText = mergeStrings(
      originalNode.object.text,
      modifications.map(data => data.object.text)
    );
    const resultType = mergeResult(
      originalNode.object.type,
      modifications.map(data => data.object.type)
    );

    const mergedLinks = await mergeStrategy.mergeLinks(
      originalNode.object.links,
      modifications.map(data => data.object.links)
    );

    return {
      links: mergedLinks,
      text: resultText,
      type: resultType
    };
  };
}

@injectable()
export class TextNodeActions extends TextNodeEntity implements HasActions {
  constructor(
    @inject(CorePatterns.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(CortexModule.types.Recognizer) protected recognizer: PatternRecognizer
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
export class TextNodeCreate extends TextNodeEntity implements Creatable<Partial<TextNode>> {
  constructor(
    @inject(CorePatterns.Hashed) protected hashedPattern: Pattern & Hashable<any>,
    @inject(DocumentsTypes.Documents) protected documents: Documents,
    @multiInject(EveesModule.types.PerspectivePattern) protected perspectivePatterns: Pattern[]
  ) {
    super(hashedPattern);
  }

  create = () => async (node: Partial<TextNode> | undefined, upl?: string): Promise<string> => {
    const links = node && node.links ? node.links : [];
    const text = node && node.text ? node.text : '';
    const type = node && node.type ? node.type : TextType.Paragraph;

    if (!upl) {
      upl = this.documents.service.remote.getAllServicesUpl().find(upl => !upl.includes('http'));
    }

    const newTextNode = { links, text, type };
    const { id } = await this.documents.createTextNode(newTextNode, upl);

    return id;
  };
}

@injectable()
export class TextNodeTitle extends TextNodeEntity implements HasTitle {
  title = (textNode: Hashed<TextNode>) => textNode.object.text;
}
