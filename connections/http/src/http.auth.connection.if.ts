import { ConnectionLogged } from '@uprtcl/evees';
import { HttpConnection } from './http.connection';

export interface HttpAuthenticatedConnection extends HttpConnection, ConnectionLogged {}
