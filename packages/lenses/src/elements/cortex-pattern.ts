import { LitElement, property, html } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, CortexModule } from '@uprtcl/cortex';
import { HasLenses } from 'src/properties/has-lenses';

export class CortexPattern extends moduleConnect(LitElement) {
  @property()
  public pattern: any;

  @property({ type: Object })
  public context!: any;

  private recognizer!: PatternRecognizer;

  connectedCallback() {
    super.connectedCallback();
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
  }

  getLens() {
    const patterns = this.recognizer.recognize(this.pattern);
    const hasLenses: HasLenses | undefined = patterns.find(p => (p as HasLenses).lenses);

    if (!hasLenses)
      throw new Error(
        `Pattern ${JSON.stringify(
          this.pattern
        )} does not implement HasLenses behaviour, hence it cannot be rendered`
      );
    return hasLenses.lenses(this.pattern);
  }

  render() {
    const lens = this.getLens()[0];
    return html`
      ${lens.render(html``, this.context)}
    `;
  }
}
