import { LitElement, property, html } from 'lit-element';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { PatternRecognizer, CortexModule } from '@uprtcl/cortex';

import { HasLenses } from '../behaviours/has-lenses';

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
    const hasLenses: HasLenses<any> | undefined = this.recognizer
      .recognizeBehaviours(this.pattern)
      .find((p) => (p as HasLenses<any>).lenses);

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
    return html` ${lens.render(null as any, this.context)} `;
  }
}
