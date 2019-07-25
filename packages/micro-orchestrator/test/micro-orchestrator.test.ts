import { MockModule } from './mocks/mock.module';
import MicroOrchestrator from '../src/orchestrator/micro-orchestrator';

describe('MicroOrchestrator test', () => {
  it('instantiate orchestrator', async () => {
    const orchestrator = MicroOrchestrator.get();

    expect(orchestrator).toBeDefined();
  });

  it('load mock module', async () => {
    const orchestrator = MicroOrchestrator.get();
    const mock = new MockModule();
    orchestrator.addModules([mock]);

    const spyLoad = jest.spyOn(mock, 'onLoad');

    const module = await orchestrator.loadModule('mock');

    expect(spyLoad).toHaveBeenCalledTimes(1);
    expect(module).toEqual(mock);
  });
});
