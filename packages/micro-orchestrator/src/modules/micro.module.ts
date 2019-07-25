import { Dictionary } from 'lodash';

export interface MicroModule {
  onLoad(dependencies: Dictionary<MicroModule>): Promise<void>;

  onUnload(): Promise<void>;

  getDependencies(): Array<string>;

  getId(): string;
}
