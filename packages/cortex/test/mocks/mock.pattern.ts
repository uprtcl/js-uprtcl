import { injectable } from 'inversify';

import { Pattern, HasText } from '../../src/uprtcl-cortex';

export class MockPattern extends Pattern<{ test: string }> {
  recognize(object: any) {
    return object.test && typeof object.test === 'string';
  }

  type = 'Mock';
}

@injectable()
export class Text implements HasText<{ test: string }> {
  text = (pattern: { test: string }) => pattern.test;
}
