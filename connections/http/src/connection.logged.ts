import { ConnectionLogged } from '@uprtcl/evees';
import { HttpConnection } from './http.connection';

export interface HttpConnectionLogged extends HttpConnection, ConnectionLogged {
  host: string;
}
