import { Logger } from '@uprtcl/evees';
import { HttpAuthentication } from './auth/http.authentication';
import { AuthTokenStorage } from './auth/http.token.store';
import { GetResult, HttpConnection, PostResult } from './http.connection';

/** Exposes wrappers to FETCH methods, and injects the header authentication
 * credentials (provided by HttpAuthentication service) */
export class HttpAuthenticatedConnection implements HttpConnection {
  logger = new Logger('HTTP CONNECTION');

  tokenStore!: AuthTokenStorage;

  constructor(
    readonly host: string,
    private authentication?: HttpAuthentication,
    tokenStorageId?: string,
    userStorageId?: string
  ) {
    if (tokenStorageId && userStorageId) {
      this.tokenStore = new AuthTokenStorage(tokenStorageId, userStorageId);
    }
  }

  async login() {
    if (!this.authentication) throw new Error('Authentication service not defined');

    const token = await this.authentication.obtainToken();
    this.tokenStore.authToken = 'Bearer ' + token.jwt;
    this.tokenStore.userId = token.userId;
  }

  get headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.tokenStore.authToken) {
      headers['Authorization'] = this.tokenStore.authToken;
    }

    return headers;
  }

  public async get<T>(url: string): Promise<T> {
    this.logger.log('[HTTP GET]: ', url);

    return fetch(this.host + url, {
      method: 'GET',
      headers: this.headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json() as Promise<GetResult<T>>;
      })
      .then((getResult) => {
        // this.logger.log('[HTTP GET RESULT] ', url, getResult);
        if (getResult.result === 'error') {
          throw new Error(`Error fetching url: ${url}`);
        }
        return getResult.data;
      });
  }

  public async getWithPut<T>(url: string, body: any): Promise<T> {
    this.logger.log('PUT: ', url);

    return fetch(this.host + url, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json() as Promise<{ data: T }>;
      })
      .then((data) => {
        this.logger.log('[HTTP PUT RESULT] ', url, data);
        return data.data;
      });
  }

  public async put(url: string, body: any): Promise<PostResult> {
    return this.putOrPost(url, body, 'PUT');
  }

  public async post(url: string, body: any): Promise<PostResult> {
    return this.putOrPost(url, body, 'POST');
  }

  public async delete(url: string): Promise<PostResult> {
    this.logger.log('[HTTP DELETE]', this.host + url);
    return fetch(url, {
      method: 'DELETE',
      headers: {
        ...this.headers,
        Accept: 'application/json',
      },
    })
      .then((response) => {
        return response.json() as Promise<PostResult>;
      })
      .then((data) => {
        this.logger.log('[HTTP POST RESULT]', url, data);
        return (data as unknown) as PostResult;
      });
  }

  public async putOrPost(url: string, body: any, method: string): Promise<PostResult> {
    this.logger.log(`[HTTP ${method}]`, url, body);
    return fetch(this.host + url, {
      method: method,
      headers: {
        ...this.headers,
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        return response.json() as Promise<PostResult>;
      })
      .then((data) => {
        this.logger.log('[HTTP POST RESULT]', url, body, data);
        return (data as unknown) as PostResult;
      });
  }
}
