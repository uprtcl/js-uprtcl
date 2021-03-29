import { HttpAuthentication, JwtToken } from './auth/http.authentication';
import { HttpAuthenticatedConnection } from './http.auth.connection.if';
import { HttpConnection } from './http.connection';
import { GetResult, PostResult } from './http.connection';

interface TestUser {
  userId: string;
  jwt: string;
}

class HttpTestToken implements HttpAuthentication {
  constructor(public user) {}

  async obtainToken(): Promise<JwtToken> {
    return {
      userId: this.user.userId,
      jwt: this.user.jwt,
    };
  }
}

class HttpAuthenticatedTestConnectionImp implements HttpAuthenticatedConnection {
  userId?: string;
  userToken?: string;

  constructor(
    readonly host: string,
    protected authentication?: HttpAuthentication,
    tokenStorageId?: string,
    userStorageId?: string
  ) {
    this.userToken = tokenStorageId;
    this.userId = userStorageId;
  }

  async login() {}

  async connect(): Promise<void> {}

  async isConnected(): Promise<boolean> {
    return true;
  }
  async disconnect(): Promise<void> {}

  async isLogged(): Promise<boolean> {
    return this.userId !== undefined;
  }
  async logout(): Promise<void> {}

  get headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.userToken) {
      headers['Authorization'] = this.userToken;
    }

    return headers;
  }

  public async get<T>(url: string): Promise<T> {
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
        return (data as unknown) as PostResult;
      });
  }

  public async putOrPost(url: string, body: any, method: string): Promise<PostResult> {
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
        return (data as unknown) as PostResult;
      });
  }
}

class HttpTestConnection extends HttpAuthenticatedTestConnectionImp {
  constructor(host: string, user: TestUser) {
    super(host, new HttpTestToken(user), user.jwt, user.userId);
  }
}

export class HttpSupertest implements HttpConnection {
  user: TestUser;
  constructor(readonly host: string, user: TestUser) {
    this.user = user;
  }

  connection(): HttpAuthenticatedConnection {
    return new HttpTestConnection(this.host, this.user);
  }

  async connect(): Promise<void> {}

  async isConnected(): Promise<boolean> {
    return true;
  }
  async disconnect(): Promise<void> {}

  async login() {}

  async isLogged(): Promise<boolean> {
    return this.user.userId !== undefined;
  }
  async logout(): Promise<void> {}

  get<T>(url: string): Promise<T> {
    return this.connection().get<T>(url);
  }
  getWithPut<T>(url: string, body: any): Promise<T> {
    return this.connection().getWithPut<T>(url, body);
  }
  put(url: string, body: any): Promise<PostResult> {
    return this.connection().put(url, body);
  }
  post(url: string, body: any): Promise<PostResult> {
    return this.connection().post(url, body);
  }
  delete(url: string): Promise<PostResult> {
    return this.connection().delete(url);
  }
  putOrPost(url: string, body: any, method: string): Promise<PostResult> {
    return this.connection().putOrPost(url, body, method);
  }
}
