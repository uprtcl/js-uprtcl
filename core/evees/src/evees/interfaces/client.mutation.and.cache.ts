import { ClientCache } from './cas.cache';
import { ClientMutationStore } from './client.mutation.store';

export interface ClientMutationAndCache extends ClientMutationStore, ClientCache {}
