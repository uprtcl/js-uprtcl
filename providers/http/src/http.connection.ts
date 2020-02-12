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

/**
 * Wrapper over the fetch API
 */
export class HttpConnection extends Connection {
  constructor(
    protected httpOptions: HttpConnectionOptions = {
      headerIdentifier: 'Authorization',
      tokenIdLocal: 'http_jwt_token',
      userIdLocal: 'http_user_id'
    },
    options: ConnectionOptions
  ) {
    super(options);
  }

  protected connect(): Promise<void> {
    return Promise.resolve();
  }

  get authToken(): string | undefined {
    // const token = localStorage.getItem(this.httpOptions.tokenIdLocal);
    // if (token != null) {
    //   return token;
    // }
    return '';
  }

  set authToken(token: string | undefined) {
    // if (token != null) {
    //   localStorage.setItem(this.httpOptions.tokenIdLocal, token);
    // }
  }

  get userId(): string | undefined {
    // const userId = localStorage.getItem(this.httpOptions.userIdLocal);
    // if (userId != null) {
    //   return userId;
    // }
    return 'dummy-id';
  }

  set userId(userId: string | undefined) {
    // if (userId != null) {
    //   localStorage.setItem(this.httpOptions.userIdLocal, userId);
    // }
  }

  /**
   * Builds the headers for the requests
   */
  get headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.authToken) {
      headers[this.httpOptions.headerIdentifier] = this.authToken;
    }

    return headers;
  }

  /**
   * Execute a GET request
   * @param url url to make the request to
   */
  public async get<T>(url: string): Promise<T> {
    this.logger.log('[HTTP GET]: ', url);

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
        this.logger.log('[HTTP GET RESULT] ', url, data);
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
        this.logger.log('[HTTP PUT RESULT] ', url, data);
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

  /**
   * Execute a PUT or POST request
   * @param url url to make the request to
   * @param body body of the request
   * @param method method of the request ('POST' or 'PUT')
   */
  public async putOrPost(url: string, body: any, method: string): Promise<PostResult> {
    this.logger.log(`[HTTP ${method}]`, url, body);
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
        this.logger.log('[HTTP POST RESULT]', url, body, data);
        return (data as unknown) as PostResult;
      });
  }
}
