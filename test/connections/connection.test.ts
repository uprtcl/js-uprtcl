import { WebSocketMock } from '../mocks/websocket.mock';
import { ConnectionState } from '../../src/connections/connection';

/**
 * Connection test
 */
describe('Connection test', () => {
  /* it('connection succeeds', async () => {
    const websocketMock = new WebSocketMock(false);
    expect(websocketMock.state).toBe(ConnectionState.PENDING);

    await expect(websocketMock.ready()).resolves.toBe(null);
    expect(websocketMock.state).toBe(ConnectionState.SUCCESS);
  }); */

  it('connection retries', async () => {
    const websocketMock = new WebSocketMock(true);
    expect(websocketMock.state).toBe(ConnectionState.PENDING);
    
    await expect(websocketMock.ready()).rejects.toBe(undefined);

    expect(websocketMock.state).toBe(ConnectionState.FAILED);
    expect(websocketMock.calls).toBe(5);
  });
});
