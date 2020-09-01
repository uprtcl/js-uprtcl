import { html, css, property, LitElement, query } from 'lit-element';
import { DEFAULT_COLOR, eveeColor } from './support';
import { UprtclPopper } from '@uprtcl/common-ui';

const styleMap = (style) => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(
      /([A-Z])/g,
      (matches) => `-${matches[0].toLowerCase()}`
    );
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

export class EveesInfoPopper extends LitElement {
  @property({ type: String, attribute: 'uref' })
  uref!: string;

  @property({ type: String, attribute: 'first-uref' })
  firstRef!: string;

  @property({ type: String, attribute: 'default-authority' })
  defaultAuthority: string | undefined = undefined;

  @property({ type: String, attribute: 'evee-color' })
  eveeColor!: string;

  @property({ type: Boolean, attribute: 'show-perspectives' })
  showPerspectives: boolean = false;

  @property({ type: Boolean, attribute: 'show-proposals' })
  showProposals: boolean = false;

  @property({ type: Boolean, attribute: 'show-acl' })
  showAcl: boolean = false;

  @property({ type: Boolean, attribute: 'show-info' })
  showInfo: boolean = false;

  @query('#info-popper')
  infoPopper!: UprtclPopper;

  color() {
    if (this.uref === this.firstRef) {
      return this.eveeColor ? this.eveeColor : DEFAULT_COLOR;
    } else {
      return eveeColor(this.uref);
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('checkout-perspective', ((event: CustomEvent) => {
      this.infoPopper.showDropdown = false;
      this.requestUpdate();
    }) as EventListener);
  }

  render() {
    return html`
      <uprtcl-popper id="info-popper" position="right">
        <div slot="icon" class="button">
          <div
            class="evee-stripe"
            style=${styleMap({
              backgroundColor: this.color() + 'FF',
            })}
          ></div>
        </div>
        <evees-info-page
          ?show-perspectives=${this.showPerspectives}
          ?show-proposals=${this.showProposals}
          ?show-acl=${this.showAcl}
          ?show-info=${this.showInfo}
          uref=${this.uref}
          first-uref=${this.firstRef as string}
          evee-color=${this.color()}
          .default-authority=${this.defaultAuthority}
        ></evees-info-page>
      </uprtcl-popper>
    `;
  }

  static get styles() {
    return [
      css`
        :host {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        uprtcl-popper {
          flex-grow: 1;
          --box-width: 500px;
        }

        evees-info-page {
          padding: 5vw 0vw;
          display: block;
        }

        .button {
          cursor: pointer;
          padding-top: 5px;
          height: 100%;
          border-radius: 3px;
          user-select: none;
          transition: background-color 100ms linear;
        }
        .button:hover {
          background-color: #eef1f1;
        }
        .evee-stripe {
          width: 10px;
          height: calc(100% - 10px);
          border-radius: 3px;
        }
      `,
    ];
  }
}
