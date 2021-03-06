import { Logger } from '@uprtcl/evees';
import { HttpAuthentication } from './auth/http.authentication';
import { AuthTokenStorage } from './auth/http.token.store';
import { HttpAuthenticatedConnection } from './http.auth.connection.if';
import { GetResult, PostResult } from './http.connection';

const LOG = false;

/** Exposes wrappers to FETCH methods, and injects the header authentication
 * credentials (provided by HttpAuthentication service) */
export class HttpAuthenticatedConnectionImp implements HttpAuthenticatedConnection {
  logger = new Logger('HTTP CONNECTION');

  tokenStore!: AuthTokenStorage;

  constructor(
    readonly host: string,
    protected authentication?: HttpAuthentication,
    tokenStorageId?: string,
    userStorageId?: string
  ) {
    if (tokenStorageId && userStorageId) {
      this.tokenStore = new AuthTokenStorage(tokenStorageId, userStorageId);
    }
  }

  get userId() {
    return this.tokenStore.userId;
  }

  async login() {
    if (!this.authentication) throw new Error('Authentication service not defined');

    const token = await this.authentication.obtainToken();

    if (token.jwt && token.userId) {
      this.tokenStore.authToken = 'Bearer ' + token.jwt;
      this.tokenStore.userId = token.userId;

      const isValid = await this.get('/user/isAuthorized');

      if (!isValid) {
        this.logout();
      }
    }
  }
  async connect(): Promise<void> {}

  async isConnected(): Promise<boolean> {
    return true;
  }
  async disconnect(): Promise<void> {}

  async isLogged(): Promise<boolean> {
    return this.userId !== undefined;
  }
  async logout(): Promise<void> {
    this.tokenStore.userId = undefined;
    this.tokenStore.authToken = undefined;
  }

  get headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.tokenStore && this.tokenStore.authToken) {
      headers['Authorization'] = this.tokenStore.authToken;
    }

    return headers;
  }

  public async get<T>(url: string): Promise<T> {
    if (LOG) this.logger.log('[HTTP GET]: ', url);

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
        if (LOG) this.logger.log('[HTTP GET RESULT] ', url, getResult);
        if (getResult.result === 'error') {
          throw new Error(`Error fetching url: ${url}`);
        }
        return getResult.data;
      });
  }

  public async getWithPut<T>(url: string, body: any): Promise<T> {
    if (LOG) this.logger.log('PUT: ', url);

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
        if (LOG) this.logger.log('[HTTP PUT RESULT] ', url, data);
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
    if (LOG) this.logger.log('[HTTP DELETE]', this.host + url);
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
        if (LOG) this.logger.log('[HTTP POST RESULT]', url, data);
        return (data as unknown) as PostResult;
      });
  }

  public async putOrPost(url: string, body: any, method: string): Promise<PostResult> {
    if (LOG) this.logger.log(`[HTTP ${method}]`, url, body);
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
        if (LOG) this.logger.log('[HTTP POST RESULT]', url, body, data);
        return (data as unknown) as PostResult;
      });
  }
}
