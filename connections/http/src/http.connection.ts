export interface PostResult {
  result: string;
  message: string;
  elementIds: string[];
}

export interface GetResult<T> {
  result: string;
  message: string;
  data: T;
}

/** Exposes wrappers to FETCH methods, and injects the header authentication
 * credentials (provided by HttpAuthentication service) */
export interface HttpConnection {
  get<T>(url: string): Promise<T>;
  getWithPut<T>(url: string, body: any): Promise<T>;
  put(url: string, body: any): Promise<PostResult>;
  post(url: string, body: any): Promise<PostResult>;
  delete(url: string): Promise<PostResult>;
  putOrPost(url: string, body: any, method: string): Promise<PostResult>;
}
