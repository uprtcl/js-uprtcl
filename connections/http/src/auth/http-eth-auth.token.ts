import { ethers } from 'ethers';
import { AuthTokenStorage } from './http.token.store';
import { HttpAuthentication, JwtToken } from './http.authentication';

export const loginMessage = (nonce: string) => {
  return `Login to Intercreativity \n\nnonce:${nonce}`;
};

export class HttpEthAuthConnection implements HttpAuthentication {
  store: AuthTokenStorage;

  constructor(public host) {
    this.store = new AuthTokenStorage('ETH_AUTH_TOKEN', 'ETH_USER_ID');
  }

  async obtainToken(): Promise<JwtToken> {
    const provider = new ethers.providers.Web3Provider(window['ethereum']);
    const signer = provider.getSigner();
    const userId = await signer.getAddress();

    const response = await fetch(`${this.host}/user/${userId}/nonce`);
    const nonce = (response as any).data;

    const signature = await signer.signMessage(loginMessage(nonce));

    const result = fetch(`${this.host}/user/${userId}/authorize`, { signature });
    const token = (response as any).data;

    return token;
  }
}
