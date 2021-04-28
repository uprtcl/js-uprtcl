import { ClientCache } from './cas.cache';
import { ClientMutationStore } from './client.mutation.store';

export interface ClientMutationCached extends ClientMutationStore, ClientCache {}
