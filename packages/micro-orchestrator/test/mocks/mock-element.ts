import { LitElement, html } from 'lit-element';
import { moduleConnect, request } from '../../src/uprtcl-micro-orchestrator';
import { MockBindings } from './mock-bindings';

export class MockElement extends moduleConnect(LitElement) {
  @request(MockBindings.Mock)
  field!: number;

  render() {
    return html` <span>${this.field}</span> `;
  }
}
