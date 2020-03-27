import { injectable } from 'inversify';

import { Pattern, HasContent } from '../../src/uprtcl-cortex';

export class MockPattern extends Pattern<{ test: string }> {
  recognize(object: any) {
    return object.test && typeof object.test === 'string';
  }

  type = 'Mock';
}

@injectable()
export class Content implements HasContent<{ test: string }> {
  content = async (pattern: { test: string }) => pattern.test;
}
