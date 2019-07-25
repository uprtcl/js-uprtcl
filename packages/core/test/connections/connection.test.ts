import { WebSocketMock } from '../mocks/websocket.mock';
import { ConnectionState } from '../../src/connections/connection';
import { WebSocket } from 'mock-socket';

global['WebSocket'] = WebSocket; // Here we stub out the window object

/**
 * Connection test
 */
describe('Connection test', () => {
  it('connection succeeds', async () => {
    const websocketMock = new WebSocketMock(false);
    expect(websocketMock.state).toBe(ConnectionState.PENDING);

    await expect(websocketMock.ready()).resolves.toBe(undefined);
    expect(websocketMock.state).toBe(ConnectionState.SUCCESS);
  });

  it('connection retries', async () => {
    const websocketMock = new WebSocketMock(true);
    expect(websocketMock.state).toBe(ConnectionState.PENDING);

    await expect(websocketMock.ready()).rejects.toBe(undefined);

    expect(websocketMock.state).toBe(ConnectionState.FAILED);
    expect(websocketMock.calls).toBe(5);
  });

  it('websocket connection close triggers retries', async done => {
    const websocketMock = new WebSocketMock(false);
    expect(websocketMock.state).toBe(ConnectionState.PENDING);

    await expect(websocketMock.ready()).resolves.toBe(undefined);
    expect(websocketMock.state).toBe(ConnectionState.SUCCESS);

    websocketMock.ws.close();

    setTimeout(async () => {
      expect(websocketMock.state).toBe(ConnectionState.PENDING);

      await expect(websocketMock.ready()).resolves.toBe(undefined);
      expect(websocketMock.state).toBe(ConnectionState.SUCCESS);
      done();
    }, 100);
  });

  it('connection retries disabled when -1', async () => {
    const websocketMock = new WebSocketMock(true, { retries: -1 });
    expect(websocketMock.state).toBe(ConnectionState.PENDING);

    await expect(websocketMock.ready()).rejects.toBe(undefined);

    expect(websocketMock.state).toBe(ConnectionState.FAILED);
    expect(websocketMock.calls).toBe(1);
  });
});
