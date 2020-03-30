import { Pattern } from '@uprtcl/cortex';
import { injectable } from 'inversify';

@injectable()
export class MockPattern extends Pattern<any> {
  recognize() {
    return true;
  }

  type = 'Mock';
}
