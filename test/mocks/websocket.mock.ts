import { SocketConnection } from '../../src/connections/socket.connection';
import WebSocket from 'ws';
import { ConnectionOptions } from '../../src/connections/connection';

export class WebSocketMock extends SocketConnection {
  calls = 0;

  constructor(private error: boolean, options: ConnectionOptions = {}) {
    super(options);
  }

  async createSocket(): Promise<WebSocket> {
    this.calls++;
    if (this.error) throw new Error('Error connecting to the websocket');
    return new global['WebSocket']('ws://echo.websocket.org');
  }
}
