import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';

interface HttpConnectionOptions {
  tokenIdLocal: string;
  userIdLocal: string;
  headerIdentifier: string;
}

export interface PostResult {
  result: string;
  message: string;
  elementIds: string[];
}

const LOGINFO = false;
/** TODO: two modules that instanciate two http connections will conflict */

/**
 * Wrapper over the fetch API
 */
export class HttpConnection extends Connection {

  /** used to keep the token in memory in case tokenId is undefined */
  private tokenMem: string | undefined = undefined;
  userId: string | undefined = undefined;

  constructor(
    protected httpOptions: HttpConnectionOptions,
    options: ConnectionOptions, 
    protected tokenId: string | null = 'HTTP_AUTH_TOKEN'
  ) {
    super(options);
  }

  public get authToken() : string | undefined {
    if (this.tokenId == null) return this.tokenMem;

    const token = localStorage.getItem(this.tokenId);
    if (token === null) return undefined;
    return token
  }

  public set authToken(token: string | undefined) {
    if (this.tokenId == null) {
      this.tokenMem = token;
      return;
    }

    if (token !== undefined) {
      localStorage.setItem(this.tokenId, token);
    } else {
      localStorage.removeItem(this.tokenId);
    }
  }

  protected connect(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Builds the headers for the requests
   */
  get headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.authToken) {
      headers['Authorization'] = this.authToken;
    }

    return headers;
  }

  /**
   * Execute a GET request
   * @param url url to make the request to
   */
  public async get<T>(url: string): Promise<T> {
    if (LOGINFO) this.logger.log('[HTTP GET]: ', url);

    return fetch(url, {
      method: 'GET',
      headers: this.headers
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json() as Promise<{ data: T }>;
      })
      .then(data => {
        if (LOGINFO) this.logger.log('[HTTP GET RESULT] ', url, data);
        return data.data;
      });
  }

  public async getWithPut<T>(url: string, body: any): Promise<T> {
    this.logger.log('PUT: ', url);

    return fetch(url, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json() as Promise<{ data: T }>;
      })
      .then(data => {
        if (LOGINFO) this.logger.log('[HTTP PUT RESULT] ', url, data);
        return data.data;
      });
  }

  /**
   * Execute a PUT request
   * @param url url to make the request to
   * @param body body of the request
   */
  public async put(url: string, body: any): Promise<PostResult> {
    return this.putOrPost(url, body, 'PUT');
  }

  /**
   * Execute a POST request
   * @param url url to make the request to
   * @param body body of the request
   */
  public async post(url: string, body: any): Promise<PostResult> {
    return this.putOrPost(url, body, 'POST');
  }

  public async delete(url: string): Promise<PostResult> {
    this.logger.log(`[HTTP DELETE]`, url);
    return fetch(url, {
      method: 'DELETE',
      headers: {
        ...this.headers,
        Accept: 'application/json'
      }
    })
      .then(response => {
        return response.json() as Promise<PostResult>;
      })
      .then(data => {
        this.logger.log('[HTTP POST RESULT]', url, data);
        return (data as unknown) as PostResult;
      });
  }

  /**
   * Execute a PUT or POST request
   * @param url url to make the request to
   * @param body body of the request
   * @param method method of the request ('POST' or 'PUT')
   */
  public async putOrPost(url: string, body: any, method: string): Promise<PostResult> {
    if (LOGINFO) this.logger.log(`[HTTP ${method}]`, url, body);
    return fetch(url, {
      method: method,
      headers: {
        ...this.headers,
        Accept: 'application/json'
      },
      body: JSON.stringify(body)
    })
      .then(response => {
        return response.json() as Promise<PostResult>;
      })
      .then(data => {
        if (LOGINFO) this.logger.log('[HTTP POST RESULT]', url, body, data);
        return (data as unknown) as PostResult;
      });
  }
}
