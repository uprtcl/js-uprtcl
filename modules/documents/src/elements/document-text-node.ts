import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html } from 'lit-element';

import { sharedStyles } from '@uprtcl/lenses';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/common';
import { CREATE_COMMIT, UPDATE_HEAD } from '@uprtcl/evees';

import { TextNode, TextType } from '../types';
import { CREATE_TEXT_NODE } from '../graphql/queries';

export class DocumentTextNode extends moduleConnect(LitElement) {
  @property({ type: String })
  nodeId!: string;

  @property({ type: Object })
  textNode: Hashed<TextNode> | undefined = undefined;

  @property()
  editable!: boolean;

  @property()
  currentHead: string | undefined = undefined;

  lastChangeTimeout: any;
  lastText!: string;

  static get styles() {
    return sharedStyles;
  }

  async loadNode() {
    this.textNode = undefined;

    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);
    const result = await client.query({
      query: gql`
        {
          entity(id: "${this.nodeId}") {
            id
            ... on Perspective {
              head {
                id
              }
            }
            _patterns {
              content {
                id
                ... on TextNode {
                  text
                  type
                  links {
                    id
                  }
                }
              }
              accessControl {
                canWrite
              }
            }
          }
        }
      `
    });

    this.textNode = result.data.entity._patterns.content;
    const head = result.data.entity.head;
    this.currentHead = head ? head.id : undefined;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('keypress', e => {
      const key = e.which || e.keyCode;
      // 13 is enter
      if (key === 13) {
        e.preventDefault();
        e.stopPropagation();

        // TODO: create child
      }
    });
  }

  render() {
    if (!this.textNode)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    return html`
      <div class="row">
        <div class="column" style="flex: 1;">
          ${this.textNode.object.type === TextType.Paragraph
            ? html`
                <div
                  contenteditable=${this.editable ? 'true' : 'false'}
                  @input=${e => e.target && this.textInput(e.target['innerText'])}
                >
                  ${this.textNode.object.text}
                </div>
              `
            : html`
                <h3
                  contenteditable=${this.editable ? 'true' : 'false'}
                  @input=${e => e.target && this.textInput(e.target['innerText'])}
                >
                  ${this.textNode.object.text}
                </h3>
              `}
          ${this.textNode.object.links.map(
            link => html`
              <cortex-entity .hash=${link} lens-type="content"></cortex-entity>
            `
          )}
        </div>

        <div style="flex: 0">
          <slot name="plugins"></slot>
        </div>
      </div>
    `;
  }

  textInput(content: string) {
    if (this.lastChangeTimeout) {
      clearTimeout(this.lastChangeTimeout);
    }

    this.lastText = content;

    this.lastChangeTimeout = setTimeout(
      () =>
        this.textNode &&
        this.updateContent({
          ...this.textNode.object,
          text: this.lastText
        }),
      2000
    );
  }

  async updateContent(newContent: TextNode) {
    if (!this.textNode) return;

    const client: ApolloClient<any> = this.request(ApolloClientModule.types.Client);
    const result = await client.mutate({
      mutation: CREATE_TEXT_NODE,
      variables: {
        content: newContent
      }
    });

    const textNodeId = result.data.createTextNode.id;

    const commit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: textNodeId,
        parentsIds: this.currentHead ? [this.currentHead] : []
      }
    });

    await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.nodeId,
        headId: commit.data.createCommit.id
      }
    });
  }
}
