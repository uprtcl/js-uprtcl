import { property, html, css } from 'lit-element';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { EveesContent, SpliceChildrenEvent } from '@uprtcl/evees';
import { Logger } from '@uprtcl/micro-orchestrator';

import { TextNode, TextType } from '../types';
import { DocumentsBindings } from '../bindings';
import { Hashed } from '@uprtcl/cortex';
import { APPEND_ACTION, FOCUS_ACTION } from './prosemirror/documents-text-node-editor';

export class DocumentTextNode extends EveesContent<TextNode> {

  logger = new Logger('DOCUMENT-TEXT-NODE');

  @property({ type: Boolean, attribute: false })
  focused: Boolean = false;

  @property({ type: String, attribute: 'toggle-action' })
  toggleAction = 'false';

  @property({ type: Object})
  action = {};

  @property({ type: String, attribute: false })
  toggleActionToChild: string = 'true';

  @property({ type: String, attribute: false })
  toggleActionToEditor: string = 'true';

  actionToEditor = {};

  actionOnIx: number = 0;
  actionToChild: any = {};

  symbol: symbol | undefined = DocumentsBindings.TextNodeEntity;

  currentText: string | undefined = undefined;

  getEmptyEntity() {
    return {
      text: '<p></p>',
      type: TextType.Paragraph,
      links: []
    }
  };

  initNode(text: string, type: TextType) {
    /** init a node with the provided text guranteeing either the <p> or <h1> external tag
     *  is consistent with the request type */
    const innerHTML = this.nodeInnerHTML(text);

    let newText;
    if (type === TextType.Paragraph) {
      newText = `<p>${innerHTML}</p>`
    } else {
      newText = `<h1>${innerHTML}</h1>`
    }

    return {
      text: newText,
      type: type,
      links: []
    }
  }

  async firstUpdated() {
    this.logger.log('firstUpdated()');

    super.firstUpdated();
    await this.updateRefData();
    if (this.data !== undefined) {
      this.currentText = this.data.object.text;
    }
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    
    if (changedProperties.has('toggleAction')) {
      if (changedProperties.get('toggleAction') !== undefined) {
        this.runAction(this.action);
      }
    }

    // this.logger.log('updated()', { changedProperties, data: this.data, ref: this.ref, editable: this.editable, level: this.level, genealogy: this.genealogy });
  }

  runAction(action: any) {
    if (!action) return;
    if (!this.data) return;

    switch (action.name) {
      case APPEND_ACTION:
        this.sendActionToEditor(action);
        break;

      case FOCUS_ACTION:
        const last = action.pars.last !== undefined ? action.pars.last : false;
        if(!last) {
          this.sendActionToEditor(action);
        } else {
          const links = this.getChildren(this.data);
          if (this.data.object.links.length === 0) {
            this.sendActionToEditor(action);
          } else {
            this.sendActionToChild(this.data.object.links.length - 1, action);
          }
        }
        break;

      default:
        throw new Error(`unexpected action ${action.name}`);
    }
  }

  async spliceChildren(elements?: string[], index?: number, toIndex?: number, appendBackwards?: string) {
    const result = await super.spliceChildren(elements, index, toIndex);

    if (appendBackwards && (index !== undefined)) {
      if (index === 0) {
        /** if it was the first sub-element, append content to this node (which was the parent) */
        this.sendActionToEditor({ 
          name: APPEND_ACTION, 
          pars: { content: appendBackwards } });
      } else {
        /** if it was not first element, append content to sybling of element at index*/
        this.sendActionToChild(
          index - 1, {
            name: APPEND_ACTION,
            pars: { content: appendBackwards }
          })
      }
    }

    return result;
  }

  async enterPressed(e: CustomEvent) {
    if (!this.data) return;
    if (!this.symbol) throw new Error('this.symbol undefined');

    const content = e.detail.content;
    this.logger.info('enterPressed()', { data: this.data, content });

    if (this.data.object.type === TextType.Title) {
      this.createChild(this.initNode(content, TextType.Paragraph), this.symbol, 0);
    } else {
      this.createSibling(this.initNode(content, TextType.Paragraph), this.symbol);
    }
  }

  /** get the x in <p>x</p> or <h1>x</h1>*/
  nodeInnerHTML(text: string) {
    if (text.startsWith('<')) { 
      const temp = document.createElement('template');
      temp.innerHTML = text.trim();
      if (temp.content.firstElementChild == null) {
        return '';
      }
      return temp.content.firstElementChild.innerHTML;
    } else {
      return text;
    }
  }

  async backspaceOnStart(e: CustomEvent) {
    if (!this.data) return;
    if (this.level === 1) return;

    await this.commitText();

    this.logger.log('backspaceOnStart()', { currentText: this.currentText, e });
    const innerHTML = this.nodeInnerHTML(e.detail.content)
    /** */
    this.removeFromParent(innerHTML, this.data.object.links);
  }

  selectBackward(index: number) {
    if (index === 0) {
      this.sendActionToEditor({ 
        name: FOCUS_ACTION, 
        pars: { } });
    } else {
      /** if it was not first element, append content to sybling of element at index*/
      this.sendActionToChild(
        index-1, {
          name: FOCUS_ACTION,
          pars: { last: true }
        })
    }
  }

  selectDownward(index: number) {
    if (!this.data) return;

    if (index < this.data.object.links.length - 1) {
      /** select next sybling downwards */
      this.sendActionToChild(
        index + 1, {
          name: FOCUS_ACTION,
          pars: { }
        })
    } else {
      this.dispatchEvent(new CustomEvent('select-downward', { 
        bubbles: true, 
        composed: true, 
        detail: { 
          index: this.index,
          startedOnElementId: this.data.id
        } 
      }));
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('select-backward', ((e: CustomEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: select-backward`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.selectBackward(e.detail.index);
    }) as EventListener);

    this.addEventListener('select-downward', ((e: CustomEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: select-downward`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.selectDownward(e.detail.index);
    }) as EventListener);
  }

  async keyupOnStart(e: CustomEvent) {
    if (!this.data) return;
    this.logger.info(`dispatching: select-backward`, { dataId: this.data.id });
    this.dispatchEvent(new CustomEvent('select-backward', { 
      bubbles: true, 
      composed: true, 
      detail: { 
        index: this.index,
        startedOnElementId: this.data.id
      } }))
  }

  async keydownOnEnd(e: CustomEvent) {
    if (!this.data) return;
    this.logger.info(`dispatching: select-downward`, { dataId: this.data.id });
    
    if (this.data.object.type === TextType.Title) {
      this.sendActionToChild(0, {
        name: FOCUS_ACTION,
        pars: { }
      });
    } else {
      this.dispatchEvent(new CustomEvent('select-downward', { 
        bubbles: true, 
        composed: true, 
        detail: { 
          index: this.index,
          startedOnElementId: this.data.id
        } 
      }))
    }
  }

  liftHeading() {
    if (!this.data) return;
    if (this.data.object.type !== TextType.Title) return;

    this.lift();
  }

  /** I need to communicate with the editor from here... */
  sendActionToChild(ix: number, action: object) {
    this.actionOnIx = ix;
    this.actionToChild = action;
    this.toggleActionToChild = this.toggleActionToChild === 'true' ? 'false' : 'true';
  }

  /** I need to communicate with the editor from here... */
  sendActionToEditor(action: object) {
    this.actionToEditor = action;
    this.toggleActionToEditor = this.toggleActionToEditor === 'true' ? 'false' : 'true';
  }

  editorContentChanged(e) {
    this.currentText = e.detail.content;
    this.commitText();
  }

  async commitText() {
    if (!this.data) return;
    if (!this.currentText) return;

    if (this.data.object.text === this.currentText) return;

    const newContent: TextNode = {
      ...this.data.object,
      text: this.currentText
    };

    await this.updateContentLocal(newContent);
  }

  editorFocusChanged(focused: boolean) {
    if (focused) {
      this.focused = true;
    } else {
      this.focused = false;
      this.commitText();
    }
  }

  async changeType(e: CustomEvent) {
    if (!this.data) return;

    await this.commitText();

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
              text: `<p>${this.nodeInnerHTML(this.data.object.text)}</p>`,
              type: TextType.Paragraph,
              links: [],
            };

            this.updateContent(newContent);

            /** add as syblings */
            this.dispatchEvent(
              new SpliceChildrenEvent({
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: {
                  startedOnElementId: this.data.id,
                  elements: [this.ref].concat(links),
                  index: this.index,
                  toIndex: this.index + 1
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
              text: `<h1>${this.nodeInnerHTML(this.data.object.text)}</h1>`,
              type: TextType.Title,
              links: []
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

                  /** remove these paragraphs from parent */
                  this.dispatchEvent(
                    new SpliceChildrenEvent({
                      bubbles: true,
                      cancelable: true,
                      composed: true,
                      detail: {
                        startedOnElementId: this.data.id,
                        elements: [],
                        index: this.index + 1,
                        toIndex: this.index + 1 + until
                      }
                    })
                  );
                }
              }
            }

            this.updateContent(newContent);
            return;
        }
    }
  }

  render() {
    // this.logger.log('render()', { data: this.data, ref: this.ref, editable: this.editable, level: this.level });
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
              toggle-action=${this.toggleActionToEditor}
              .action=${this.actionToEditor}
              @focus-changed=${(e) => (this.editorFocusChanged(e.detail.value))}
              @content-changed=${this.editorContentChanged}
              @enter-pressed=${this.enterPressed}
              @backspace-on-start=${this.backspaceOnStart}
              @keyup-on-start=${this.keyupOnStart}
              @keydown-on-end=${this.keydownOnEnd}
              @lift-heading=${this.liftHeading}
              @change-type=${this.changeType}
            ></documents-text-node-editor>
          </div>
          <!-- <div class="plugins">
            <slot name="plugins"></slot>
          </div> -->
        </div>

        <div class="node-children">
          ${this.data.object.links.map((link, ix) => html`
              <cortex-entity
                hash=${link}
                lens-type="evee"
                .context=${{
                  color: this.color,
                  index: ix,
                  genealogy: this.genealogy,
                  toggleAction: this.toggleActionToChild,
                  action: this.actionOnIx === ix ? this.actionToChild : undefined
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
