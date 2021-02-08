import { ethers } from 'ethers';
import { AuthTokenStorage } from './http.token.store';
import { HttpAuthentication, JwtToken } from './http.authentication';
import { HttpAuthenticatedConnection } from 'src/http.auth.connection';
import { HttpConnection } from 'src/http.connection';

export const loginMessage = (nonce: string) => {
  return `Login to Intercreativity \n\nnonce:${nonce}`;
};

export class HttpEthToken implements HttpAuthentication {
  store: AuthTokenStorage;
  connection: HttpConnection;

  constructor(public host) {
    this.store = new AuthTokenStorage('ETH_AUTH_TOKEN', 'ETH_USER_ID');
    this.connection = new HttpAuthenticatedConnection(host);
  }

  async obtainToken(): Promise<JwtToken> {
    await window['ethereum'].enable();
    const provider = new ethers.providers.Web3Provider(window['ethereum']);

    const signer = provider.getSigner();
    const userId = (await signer.getAddress()).toLocaleLowerCase();

    const nonce = await this.connection.get<string>(`/user/${userId}/nonce`);

    const signature = await signer.signMessage(loginMessage(nonce));
    const result = await this.connection.getWithPut<{ jwt: string }>(`/user/${userId}/authorize`, {
      signature,
    });

    return {
      userId,
      jwt: result.jwt,
    };
  }
}
