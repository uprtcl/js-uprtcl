import { Connection } from './connection';


export class SocketConnection extends Connection {
  ws!: WebSocket;

  protected async connect(): Promise<void> {
    this.ws = await this.createSocket();
    this.ws.onclose = () => this.retry();
  }

  protected createSocket(): Promise<WebSocket> {
    throw new Error('Method not implemented');
  }
}
