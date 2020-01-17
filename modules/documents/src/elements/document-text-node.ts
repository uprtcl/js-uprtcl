import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { ApolloClientModule, Secured } from '@uprtcl/common';
import { CREATE_COMMIT, CREATE_PERSPECTIVE, Perspective } from '@uprtcl/evees';

import { TextNode, TextType } from '../types';
import { CREATE_TEXT_NODE } from '../graphql/queries';
import { DocumentsModule } from '../documents.module';

export class DocumentTextNode extends moduleConnect(LitElement) {
  logger = new Logger('DOCUMENT-TEXT-NODE');

  @property({ type: Object })
  data: Hashed<TextNode> | undefined = undefined;

  @property({ type: Object })
  perspective: Secured<Perspective> | undefined = undefined;

  @property({ type: String })
  color: string | undefined = undefined;

  editable: Boolean = true;

  lastChangeTimeout: any;
  lastText!: string;

  textInput(e) {
    this.logger.info('textInput()', e);
  }

  async onBlur(e) {
    if (!this.data) return;

    const newText = e.target['innerText'];

    if (newText === this.data.object.text) return;

    const newContent = {
      ...this.data.object,
      text: newText
    };

    this.logger.info('onBlur()', newContent);

    await this.updateContent(newContent);
  }

  async updateContent(newContent: TextNode): Promise<void> {
    if (!this.perspective) return;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const origin = this.perspective.object.payload.origin;

    const { remoteLinks }: Dictionary<string> = this.request(DocumentsModule.id);
    const dataUsl = remoteLinks[origin];

    this.logger.info('updateContent() - CREATE_TEXT_NODE', { newContent });
    const result = await client.mutate({
      mutation: CREATE_TEXT_NODE,
      variables: {
        content: newContent,
        usl: dataUsl
      }
    });

    const textNodeId = result.data.createTextNode.id;

    this.dispatchEvent(
      new CustomEvent('update-content', {
        bubbles: true,
        composed: true,
        detail: {
          dataId: textNodeId
        }
      })
    );

    return textNodeId;
  }

  async createChild() {
    if (!this.data) return;
    if (!this.perspective) return;

    const origin = this.perspective.object.payload.origin;

    const { remoteLinks }: Dictionary<string> = this.request(DocumentsModule.id);
    const dataUsl = remoteLinks[origin];

    const newNode = {
      text: 'empty',
      type: TextType.Paragraph,
      links: []
    };

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.mutate({
      mutation: CREATE_TEXT_NODE,
      variables: {
        content: newNode,
        usl: dataUsl
      }
    });

    const commit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: result.data.createTextNode.id,
        parentsIds: [],
        usl: origin
      }
    });

    const perspective = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: commit.data.createCommit.id,
        usl: origin
      }
    });

    const newContent = {
      ...this.data.object,
      links: [...this.data.object.links, perspective.data.createPerspective.id]
    };

    this.logger.info('createChild()', newContent);
    await this.updateContent(newContent);
  }

  createSibling() {
    this.logger.info('createSibling()', { dataId: this.data ? this.data.id : undefined });
    this.dispatchEvent(
      new CustomEvent('create-sibling', {
        bubbles: true,
        composed: true,
        detail: {
          dataId: this.data ? this.data.id : undefined
        }
      })
    );
  }

  enterPressed() {
    if (!this.data) return;

    this.logger.info('enterPressed()', { data: this.data });

    if (this.data.object.type === TextType.Title) {
      this.createChild();
    } else {
      this.createSibling();
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keypress', e => {
      const key = e.which || e.keyCode;
      // 13 is enter
      if (key === 13) {
        e.preventDefault();
        e.stopPropagation();

        this.enterPressed();
      }
    });

    this.addEventListener('create-sibling', ((e: CustomEvent) => {
      if (!this.data) return;

      this.logger.info('CATCHED EVENT: create-sibling ', { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.dataId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.createChild();
    }) as EventListener);
  }

  render() {
    if (!this.data)
      return html`
        <cortex-loading-placeholder>loading text node...</cortex-loading-placeholder>
      `;

    let contentClasses = this.data.object.type === TextType.Paragraph ? ['paragraph'] : ['title'];
    contentClasses.push('content-editable');

    return html`
      <div class="column">
        <div class="row">
          <div class="evee-info">
            <slot name="evee"></slot>
          </div>
          <div class="node-content">
            <div
              class=${contentClasses.join(' ')}
              contenteditable=${this.editable ? 'true' : 'false'}
              @input=${e => this.textInput(e)}
              @blur=${e => this.onBlur(e)}
            >
              ${this.data.object.text}
            </div>
          </div>
          <div class="plugins">
            <slot name="plugins"></slot>
          </div>
        </div>

        <div class="node-children">
          ${this.data.object.links.map(
            link => html`
              <cortex-entity
                .hash=${link}
                lens-type="evee"
                .context=${{ color: this.color }}
              ></cortex-entity>
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
        flex-direction: column;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      .evee-info {
        flex-grow: 0;
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
