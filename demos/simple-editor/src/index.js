import { ReduxTypes, MicroOrchestrator, ReduxStoreModule } from '@uprtcl/micro-orchestrator';
import {
  PatternTypes,
  PatternsModule,
  discoveryModule,
  DiscoveryTypes,
  LensesTypes
} from '@uprtcl/cortex';
import { lensesModule, actionsPlugin, updatePlugin, lensSelectorPlugin } from '@uprtcl/lenses';
import { DocumentsHttp, documentsModule, DocumentsTypes } from '@uprtcl/documents';
import {
  AccessControlTypes,
  accessControlReduxModule,
  entitiesReduxModule,
  EntitiesTypes
} from '@uprtcl/common';
import { eveesModule, EveesEthereum, EveesHolochain, EveesTypes } from '@uprtcl/evees';
import { SimpleEditor } from './simple-editor';

(async function() {
  const c1host = 'http://localhost:3100/uprtcl/1'

  const eveesProvider = new EveesHttp(`${c1host}`, '');
  const documentsProvider = new DocumentsHttp(`${c1host}`, '');

  const discoverableEvees = { service: eveesProvider };

  const evees = eveesModule([discoverableEvees]);

  const discoverableDocs = {
    service: documentsProvider
  };
  const documents = documentsModule([discoverableDocs]);

  const orchestrator = new MicroOrchestrator();

  await orchestrator.loadModules(
    { id: ReduxTypes.Module, module: ReduxStoreModule },
    { id: PatternTypes.Module, module: PatternsModule },
    { id: DiscoveryTypes.Module, module: discoveryModule() },
    { id: EntitiesTypes.Module, module: entitiesReduxModule() },
    { id: AccessControlTypes.Module, module: accessControlReduxModule() },
    {
      id: LensesTypes.Module,
      module: lensesModule([updatePlugin(), lensSelectorPlugin(), actionsPlugin()])
    },
    { id: EveesTypes.Module, module: evees },
    { id: DocumentsTypes.Module, module: documents }
  );

  console.log(orchestrator);
  customElements.define('simple-editor', SimpleEditor);
})();
