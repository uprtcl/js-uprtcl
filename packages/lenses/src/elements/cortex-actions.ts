import { LitElement, html, property, query, PropertyValues, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';
import { Menu } from '@material/mwc-menu';
import '@material/mwc-list/mwc-list-item';
import '@authentic/mwc-tooltip';
import '@material/mwc-button';

import { moduleConnect, Dictionary } from '@uprtcl/micro-orchestrator';
import { PatternAction } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { sharedStyles } from '../shared-styles';

export class CortexActions extends moduleConnect(LitElement) {
  @property({ type: String })
  public hash!: string;

  @property({ type: String })
  public toolbar: 'responsive' | 'none' | 'only-icon' | 'icon-text' = 'responsive';

  @property({ type: Array })
  public actionTypesOrder: string[] | undefined;

  @query('#menu')
  menu!: Menu;

  @property({ type: Object, attribute: false })
  private actions!: Dictionary<PatternAction[]> | undefined;

  @property({ type: Number, attribute: false })
  private width!: number;

  async loadActions() {
    this.actions = undefined;
    if (!this.hash) return;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);

    const result = await client.query({
      query: gql`
      {
        entity(ref: "${this.hash}") {
          id
          _context {

            content {
              id
              _context {

                patterns {
                  actions {
                    title
                    icon
                    action
                    type
                  }
                }
              }
            }
          }
        }
      }
      `,
    });

    const actions: PatternAction[] = result.data.entity._context.content._context.patterns.actions;

    this.actions = {};

    for (const action of actions.filter((iso) => !!iso)) {
      const type = action.type || '';
      if (!this.actions[type]) this.actions[type] = [];

      this.actions[type].push(action);
    }
  }

  firstUpdated() {
    this.loadActions();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.get('hash')) {
      this.loadActions();
    }
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        .divider {
          opacity: 0.3;
        }
      `,
    ];
  }

  getActionsOrder(): string[] {
    if (this.actionTypesOrder) return this.actionTypesOrder;
    else if (!this.actions) return [];
    else return Object.keys(this.actions).sort();
  }

  getToolbarActions(): PatternAction[][] {
    const actions = this.actions;
    if (!actions) return [];

    return Object.keys(actions).map((key) => actions[key]);
  }

  getMenuActions(): PatternAction[][] {
    const actions = this.actions;
    if (!actions) return [];

    return Object.keys(actions).map((key) => actions[key]);
  }

  getAllActions(): PatternAction[][] {
    return [];
  }

  renderIconTextToolbar() {
    const toolbarActions = this.getToolbarActions();

    return html`
      ${toolbarActions.map(
        (actionTypeList, index) => html`
          ${actionTypeList.map(
            (action) => html`
              <mwc-button
                .icon=${action.icon}
                .label=${this.t(action.title)}
                @click=${() => this.actionClicked(action)}
              ></mwc-button>
            `
          )}
          ${index < toolbarActions.length - 1 ? html` <span class="divider">|</span> ` : html``}
        `
      )}
    `;
  }

  renderOnlyIconToolbar() {
    const toolbarActions = this.getToolbarActions();

    return html`
      ${toolbarActions.map(
        (actionTypeList, index) => html`
          ${actionTypeList.map(
            (action) => html`
              <mwc-icon-button
                .icon=${action.icon}
                label=${action.title}
                @click=${() => this.actionClicked(action)}
              >
                <mwc-tooltip .text=${action.title} showDelay="200" gap="5"></mwc-tooltip>
              </mwc-icon-button>
            `
          )}
          ${index < toolbarActions.length - 1 ? html` <span class="divider">|</span> ` : html``}
        `
      )}
    `;
  }

  renderMenu() {
    const menuActions = this.getMenuActions();
    const show = menuActions.length > 0;

    if (!show) return html``;

    return html`
      <mwc-icon-button
        icon="more_vert"
        @click=${() => (this.menu.open = !this.menu.open)}
      ></mwc-icon-button>

      <mwc-menu id="menu">
        <mwc-list>
          ${menuActions.map(
            (actionTypeList) =>
              html`
                ${actionTypeList.map(
                  (action) => html`
                    <mwc-list-item @click=${() => this.actionClicked(action)}>
                      <mwc-icon slot="graphic">${action.icon}</mwc-icon>
                      ${action.title}
                    </mwc-list-item>
                  `
                )}

                <mwc-list-divider></mwc-list-divider>
              `
          )}
        </mwc-list>
      </mwc-menu>
    `;
  }

  renderToolbar() {
    if (this.toolbar === 'only-icon') return this.renderOnlyIconToolbar();
    else if (this.toolbar === 'icon-text') return this.renderIconTextToolbar();
    else return html``;
  }

  render() {
    return html`
      <div class="row center-content">
        ${this.renderToolbar()} ${this.renderMenu()}
      </div>
    `;
  }

  actionClicked(action: PatternAction) {
    action.action((newContent) => {
      this.updateContent(newContent);
    });
  }

  updateContent(newContent) {
    this.dispatchEvent(
      new CustomEvent('content-changed', {
        bubbles: true,
        composed: true,
        detail: { newContent },
      })
    );
  }
}
