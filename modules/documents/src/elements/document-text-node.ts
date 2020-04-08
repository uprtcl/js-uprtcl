import { property, html, css } from 'lit-element';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { EveesContent, AddSyblingsEvent, RemoveChildrenEvent } from '@uprtcl/evees';
import { Logger } from '@uprtcl/micro-orchestrator';
import { Entity } from '@uprtcl/cortex';

import { TextNode, TextType } from '../types';
import { DocumentsBindings } from '../bindings';
import { htmlToText } from '../support/documents.support';

export class DocumentTextNode extends EveesContent<TextNode> {
  logger = new Logger('DOCUMENT-TEXT-NODE');

  @property({ type: Boolean, attribute: false })
  focused: Boolean = false;

  symbol: string | undefined = DocumentsBindings.TextNodeEntity;

  currentText: string | undefined = undefined;

  getEmptyEntity() {
    return {
      text: '<p></p>',
      type: TextType.Paragraph,
      links: []
    };
  }

  initNode(text: string, type: TextType) {
    /** init a node with the provided text guranteeing either the <p> or <h1> external tag
     *  is consistent with the request type */
    const temp = document.createElement('template');
    temp.innerHTML = text.trim();

    if (temp.content.firstElementChild == null) {
      return this.getEmptyEntity();
    }

    const innerHTML = temp.content.firstElementChild.innerHTML;

    let newText;
    if (type === TextType.Paragraph) {
      newText = `<p>${innerHTML}</p>`;
    } else {
      newText = `<h1>${innerHTML}</h1>`;
    }

    return {
      text: newText,
      type: type,
      links: []
    };
  }

  async firstUpdated() {
    this.logger.log('firstUpdated()');

    super.firstUpdated();
    await this.updateRefData();
    if (this.data !== undefined) {
      this.currentText = this.data.entity.text;
    }
  }

  updated(changedProperties: Map<string, any>) {
    this.logger.log('updated()', {
      changedProperties,
      data: this.data,
      ref: this.ref,
      editable: this.editable,
      level: this.level,
      genealogy: this.genealogy
    });
  }

  async enterPressed(e: CustomEvent) {
    await this.commit();

    if (!this.data) return;
    if (!this.symbol) throw new Error('this.symbol undefined');

    const tail = e.detail.tail;
    this.logger.info('enterPressed()', { data: this.data, tail });

    if (this.data.entity.type === TextType.Title) {
      await this.createChild(this.initNode(tail, TextType.Paragraph), this.symbol);
    } else {
      this.createSibling(this.initNode(tail, TextType.Paragraph), this.symbol);
    }
  }

  async backspacePressed() {
    this.logger.log('backspacePressed()', this.currentText);
    let empty = false;
    if (this.currentText === undefined) {
      empty = true;
    }

    if (!empty) {
      const text = htmlToText(this.currentText as string);
      empty = text === '';
    }

    this.logger.log('backspacePressed()', { empty });

    if (empty) {
      this.removeFromParent();
    }
  }

  editorContentChanged(e) {
    this.currentText = e.detail.content;
  }

  async commit() {
    if (!this.data) return;
    if (!this.currentText) return;

    const newContent: TextNode = {
      ...this.data.entity,
      text: this.currentText
    };

    await this.updateContentLocal(newContent);
  }

  editorFocusChanged(focused: boolean) {
    if (focused) {
      this.focused = true;
    } else {
      this.focused = false;
      this.commit();
    }
  }

  async changeType(e: CustomEvent) {
    if (!this.data) return;

    await this.commit();

    const newType = e.detail.type;
    let newContent: TextNode;

    switch (this.data.entity.type) {
      case TextType.Title:
        switch (newType) {
          /** title to title: setting the same view changes nothing */
          case TextType.Title:
            return;

          /** title to paragraph: changing the type of a title to a paragraph
           *  will move all its subelements as younger siblings of the new typed
           *  paragraph */
          case TextType.Paragraph:
            const links = this.data.entity.links;

            /** remove childrent */
            newContent = {
              ...this.data.entity,
              links: [],
              type: newType
            };

            this.updateContentLocal(newContent);

            /** add as syblings */
            this.dispatchEvent(
              new AddSyblingsEvent({
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: {
                  startedOnElementId: this.data.id,
                  elementIds: links,
                  index: this.index + 1
                }
              })
            );

            return;
        }

      case TextType.Paragraph:
        switch (newType) {
          case TextType.Paragraph:
            return;

          /** paragraph to title: Changing the type of a paragraph to a title
           * will move all the younger sibling contexts of the paragraph as
           * children of the new title. */
          case TextType.Title:
            let newContent: TextNode = {
              ...this.data.entity,
              type: newType
            };

            /** read parent to get syblings */
            if (this.genealogy.length > 1) {
              const parentData = (await this.getPerspectiveData(this.genealogy[1])) as Entity<
                TextNode
              >;

              if (parentData !== undefined) {
                const youngerSyblings = parentData.entity.links.splice(this.index + 1);

                if (youngerSyblings.length > 0) {
                  const syblingsDataPromises = youngerSyblings.map(async id => {
                    const data = (await this.getPerspectiveData(id)) as Entity<TextNode>;

                    if (!data) return true;
                    if (!data.entity.type) return true;
                    if (data.entity.type !== TextType.Paragraph) return true;

                    /** return true if element is not a paragraph */
                    return false;
                  });

                  const syblingsData = await Promise.all(syblingsDataPromises);

                  /** return the index first non paragraph element */
                  let until = syblingsData.findIndex(e => e);

                  if (until === -1) {
                    until = youngerSyblings.length;
                  }

                  const nextParagraphs = [...youngerSyblings];
                  nextParagraphs.slice(0, until);

                  /** add this paragraphs as children of this node */
                  let newLinks: string[] = [...this.data.entity.links];
                  if (this.index >= this.data.entity.links.length) {
                    newLinks.push(...nextParagraphs);
                  } else {
                    newLinks.splice(this.index, 0, ...nextParagraphs);
                  }

                  newContent = {
                    ...newContent,
                    links: newLinks
                  };

                  this.updateContentLocal(newContent);

                  /** remove these paragraphs from parent */
                  this.dispatchEvent(
                    new RemoveChildrenEvent({
                      bubbles: true,
                      cancelable: true,
                      composed: true,
                      detail: {
                        startedOnElementId: this.data.id,
                        fromIndex: this.index + 1,
                        toIndex: this.index + 1 + until
                      }
                    })
                  );
                }
              }
            }
            return;
        }
    }
  }

  render() {
    this.logger.log('render()', {
      data: this.data,
      ref: this.ref,
      editable: this.editable,
      level: this.level
    });
    if (!this.data)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    let contentClasses = this.data.entity.type === TextType.Paragraph ? ['paragraph'] : ['title'];
    contentClasses.push('content-editable');

    return html`
      <div
        class="row"
        style=${styleMap({ backgroundColor: this.focused ? '#f7f6f3' : 'transparent' })}
      >
        <div class="column">
          <div class="evee-info">
            <slot name="evee-popper"></slot>
          </div>
          <div class="node-content">
            <documents-text-node-editor
              type=${this.data.entity.type}
              init=${this.data.entity.text}
              focus-init=${'true'}
              level=${this.level}
              editable=${this.editable ? 'true' : 'false'}
              @focus-changed=${e => this.editorFocusChanged(e.detail.value)}
              @content-changed=${this.editorContentChanged}
              @enter-pressed=${this.enterPressed}
              @backspace-pressed=${this.backspacePressed}
              @change-type=${this.changeType}
            ></documents-text-node-editor>
          </div>
          <!-- <div class="plugins">
            <slot name="plugins"></slot>
          </div> -->
        </div>

        <div class="node-children">
          ${this.data.entity.links.map(
            (link, ix) => html`
              <cortex-entity
                ref=${link}
                lens-type="evee"
                .context=${{
                  color: this.color,
                  index: ix,
                  genealogy: this.genealogy
                }}
              >
              </cortex-entity>
            `
          )}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: row;
      }

      .evee-info {
      }

      .node-content {
        flex-grow: 1;
      }

      .content-editable {
        padding: 11px 8px;
      }

      .node-children {
        width: 100%;
      }
    `;
  }
}
