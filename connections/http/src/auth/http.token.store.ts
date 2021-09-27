export class AuthTokenStorage {
  constructor(readonly tokenStorageId: string, readonly userStorageId: string) {}

  public get authToken(): string | undefined {
    const token = localStorage.getItem(this.tokenStorageId);
    if (token === null) return undefined;
    return token;
  }

  public set authToken(token: string | undefined) {
    if (token !== undefined) {
      localStorage.setItem(this.tokenStorageId, token);
    } else {
      localStorage.removeItem(this.tokenStorageId);
    }
  }

  public get userId(): string | undefined {
    const userId = localStorage.getItem(this.userStorageId);
    if (userId === null) return undefined;
    return userId;
  }

  public set userId(userId: string | undefined) {
    if (this.userStorageId == null) {
      return;
    }

    if (userId !== undefined) {
      localStorage.setItem(this.userStorageId, userId);
    } else {
      localStorage.removeItem(this.userStorageId);
    }
  }
}
