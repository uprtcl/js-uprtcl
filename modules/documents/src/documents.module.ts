import { Dictionary } from 'lodash';
import { MicroModule } from '@uprtcl/micro-orchestrator';
import { PATTERN_REGISTRY_MODULE_ID, PatternRegistryModule, DiscoverableSource, DISCOVERY_MODULE_ID, DiscoveryModule } from '@uprtcl/cortex';
import { TextNodeLens } from './lenses/text-node.lens';
import { TextNodePattern } from './patterns/text-node.pattern';
import { DocumentsProvider } from './services/documents.provider';

const DOCUMENTS_MODULE_ID = 'documents-module';

export class DocumentsModule implements MicroModule {

  constructor(protected discoverableDocuments: DiscoverableSource<DocumentsProvider>) {}

  async onLoad(dependencies: Dictionary<MicroModule>): Promise<void> {
    const patternRegistryModule: PatternRegistryModule = dependencies[
      PATTERN_REGISTRY_MODULE_ID
    ] as PatternRegistryModule;
    const discoveryModule: DiscoveryModule = dependencies[
      DISCOVERY_MODULE_ID
    ] as DiscoveryModule;

    discoveryModule.discoveryService.addSources(this.discoverableDocuments)

    patternRegistryModule.patternRegistry.registerPattern('text-node', new TextNodePattern(this.discoverableDocuments.source));

    customElements.define('text-node', TextNodeLens);
  }

  async onUnload(): Promise<void> {}

  getDependencies(): string[] {
    return [PATTERN_REGISTRY_MODULE_ID, DISCOVERY_MODULE_ID];
  }

  getId(): string {
    return DOCUMENTS_MODULE_ID;
  }
}
