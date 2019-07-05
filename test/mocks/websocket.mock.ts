import { SocketConnection } from '../../src/connections/socket.connection';
import WebSocket from 'ws';

export class WebSocketMock extends SocketConnection {
  calls = 0;

  constructor(private error: boolean) {
    super();
  }

  async createSocket(): Promise<WebSocket> {
    this.calls++;
    if (this.error) throw new Error('Error connecting to the websocket');
    return new WebSocket('ws://echo.websocket.org');
  }
}
