import { EveesContentModule, Logger } from '@uprtcl/evees';

export class EveesLocalModule extends EveesContentModule {
  static id = 'evees-local-module';

  logger = new Logger('EVEES-LOCAL-MODULE');

  async onLoad() {}

  get submodules() {
    return [];
  }
}
