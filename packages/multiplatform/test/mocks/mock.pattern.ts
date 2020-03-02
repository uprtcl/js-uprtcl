import { Pattern } from '@uprtcl/cortex';
import { injectable } from 'inversify';

@injectable()
export class MockPattern implements Pattern {
  recognize() {
    return true;
  }

  name = 'Mock';
}
