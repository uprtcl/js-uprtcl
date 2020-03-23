import { property, html, css } from 'lit-element';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { EveesContent } from '@uprtcl/evees';
import { AddSyblingsEvent, RemoveChildrenEvent } from '@uprtcl/evees';
import { Logger } from '@uprtcl/micro-orchestrator';

import { TextNode, TextType } from '../types';
import { DocumentsBindings } from '../bindings';
import { Hashed } from '@uprtcl/cortex';
import { htmlToText } from 'src/uprtcl-documents';

export class DocumentTextNode extends EveesContent<TextNode> {
  
  logger = new Logger('DOCUMENT-TEXT-NODE');

  @property({ type: Boolean, attribute: false })
  focused: Boolean = false;

  symbol: symbol | undefined = DocumentsBindings.TextNodeEntity;

  currentText: string | undefined = undefined;

  getEmptyEntity() {
    return {
      text: '<p></p>',
      type: TextType.Paragraph,
      links: []
    }
  };

  async firstUpdated() {
    this.logger.log('firstUpdated()');
    
    super.firstUpdated();
    await this.updateRefData();
    if (this.data !== undefined) {
      this.currentText = this.data.object.text;
    }
  }

  updated(changedProperties: Map<string, any>) {
    this.logger.log('updated()', { changedProperties, data: this.data, ref: this.ref, editable: this.editable, level: this.level, genealogy: this.genealogy });
  }

  async enterPressed() {
    this.commit();
    
    if (!this.data) return;
    if (!this.symbol) throw new Error('this.symbol undefined');

    this.logger.info('enterPressed()', { data: this.data });

    if (this.data.object.type === TextType.Title) {
      await this.createChild(this.getEmptyEntity(), this.symbol);
    } else {
      this.createSibling(this.getEmptyEntity(), this.symbol);
    }
  }

  async backspacePressed() {
    this.logger.log('backspacePressed()', this.currentText);
    let empty = false;
    if (this.currentText === undefined) {
      empty = true;
    };

    if (!empty) {
      const text = htmlToText(this.currentText as string);
      empty = text === '';
    }
    
    this.logger.log('backspacePressed()', { empty } );
    
    if (empty) {
      this.removeFromParent();
    }
  }

  editorContentChanged(e) {
    this.currentText = e.detail.content;
  }

  commit() {
    if(!this.data) return;
    if(!this.currentText) return;

    const newContent: TextNode = {
      ...this.data.object,
      text: this.currentText
    };

    this.updateContent(newContent);
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

    const newType = e.detail.type;
    let newContent: TextNode;

    switch (this.data.object.type) {
      case TextType.Title:
        switch (newType) {
          /** title to title: setting the same view changes nothing */
          case TextType.Title:
            return;

          /** title to paragraph: changing the type of a title to a paragraph
           *  will move all its subelements as younger siblings of the new typed
           *  paragraph */
          case TextType.Paragraph:
            const links = this.data.object.links;

            /** remove childrent */
            newContent = {
              ...this.data.object,
              links: [],
              type: newType
            };

            this.updateContent(newContent);

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
              ...this.data.object,
              type: newType
            };

            /** read parent to get syblings */
            if (this.genealogy.length > 1) {
              const parentData = await this.getPerspectiveData(this.genealogy[1]) as Hashed<TextNode>;

              if (parentData !== undefined) {
                const youngerSyblings = parentData.object.links.splice(this.index + 1);

                if (youngerSyblings.length > 0) {
                  const syblingsDataPromises = youngerSyblings.map(async id => {
                    const data = await this.getPerspectiveData(id) as Hashed<TextNode>;

                    if (!data) return true;
                    if (!data.object.type) return true;
                    if (data.object.type !== TextType.Paragraph) return true;

                    /** return true if element is not a paragraph */
                    return false;
                  });

                  const syblingsData = await Promise.all(syblingsDataPromises);

                  /** return the index first non paragraph element */
                  let until = syblingsData.findIndex(e => e);

                  if (until === -1) {
                    until = youngerSyblings.length;
                  }

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

                  const nextParagraphs = [...youngerSyblings];
                  nextParagraphs.slice(0, until);

                  /** add this paragraphs as children of this node */
                  let newLinks: string[] = [...this.data.object.links];
                  if (this.index >= this.data.object.links.length) {
                    newLinks.push(...nextParagraphs);
                  } else {
                    newLinks.splice(this.index, 0, ...nextParagraphs);
                  }

                  newContent = {
                    ...newContent,
                    links: newLinks
                  };
                }
              }
            }

            this.updateContent(newContent);

            return;
        }
    }
  }

  render() {
    this.logger.log('render()', { data: this.data, ref: this.ref, editable: this.editable, level: this.level });
    if (!this.data)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    let contentClasses = this.data.object.type === TextType.Paragraph ? ['paragraph'] : ['title'];
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
              type=${this.data.object.type}
              init=${this.data.object.text}
              focus-init=${'true'}
              level=${this.level}
              editable=${this.editable ? 'true' : 'false'}
              @focus-changed=${(e) => (this.editorFocusChanged(e.detail.value))}
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
          ${this.data.object.links.map(
            (link, ix) => html`
              <cortex-entity
                hash=${link}
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
