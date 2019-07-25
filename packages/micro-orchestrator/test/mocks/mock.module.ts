import { MicroModule } from '../../src/modules/micro.module';

export class MockModule implements MicroModule {
  async onLoad(): Promise<void> {}

  async onUnload(): Promise<void> {}
  getDependencies(): string[] {
    return [];
  }
  getId(): string {
    return 'mock';
  }
}
