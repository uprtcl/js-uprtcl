import { ClientAndExploreCached } from './client.explore';
import { ClientMutation } from './client.mutation';

/** A Client that supports mutations and explore */
export interface ClientFull extends ClientAndExploreCached, ClientMutation {}
