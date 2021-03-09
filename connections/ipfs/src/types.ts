export interface IpfsConnectionOptions {
  host: string;
  port: number;
  protocol: string;
  headers?: { [key: string]: string };
}

export interface PinnerConfig {
  peerMultiaddr: string;
  url: string;
}
