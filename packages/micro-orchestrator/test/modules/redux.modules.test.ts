import MicroOrchestrator from '../../src/orchestrator/micro-orchestrator';
import { StoreModule } from '../../src/modules/redux/store.module';
import { ReduxModule } from '../../src/modules/redux/redux.module';
import { AnyAction, Reducer } from 'redux';

interface State {
  count: number;
}

const reducer: Reducer = (state: State, action: AnyAction) => ({ ...state, count: state.count + 1 });

describe('ReduxModules test', () => {
  it('load store and redux module', async () => {
    const orchestrator = MicroOrchestrator.get();
    const store = new StoreModule();
    const redux = new ReduxModule('reducer', reducer);

    orchestrator.addModules([store, redux]);
    const reduxModule = await orchestrator.loadModule('reducer');

    expect(reduxModule).toEqual(redux);
  });
});
