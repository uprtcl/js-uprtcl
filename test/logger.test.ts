import { Logger, LogLevel } from '../src/logger';

/**
 * Logger test
 */
describe('Logger test', () => {
  beforeEach(() => {
    global['console'] = {
      ...global['console'],
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  });

  it('logs on minimum level', async () => {
    const logger = new Logger('test', LogLevel.INFO);

    logger.info('Hi1');
    expect(global.console.info).toHaveBeenCalledWith('[test] ', 'Hi1');

    logger.log('Hi2');
    expect(global.console.log).toHaveBeenCalledWith('[test] ', 'Hi2');

    logger.warn('Hi3');
    expect(global.console.warn).toHaveBeenCalledWith('[test] ', 'Hi3');

    logger.error('Hi4');
    expect(global.console.error).toHaveBeenCalledWith('[test] ', 'Hi4');
  });

  it('logs on maximum level', async () => {
    const logger = new Logger('test', LogLevel.ERROR);

    logger.info('Hi1');
    expect(global.console.info).toHaveBeenCalledTimes(0);

    logger.log('Hi2');
    expect(global.console.log).toHaveBeenCalledTimes(0);

    logger.warn('Hi3');
    expect(global.console.warn).toHaveBeenCalledTimes(0);

    logger.error('Hi4');
    expect(global.console.error).toHaveBeenCalledWith('[test] ', 'Hi4');
  });
});
