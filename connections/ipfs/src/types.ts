export interface IpfsConnectionOptions {
  host: string;
  port: number;
  protocol: string;
  headers?: { [key: string]: string };
}
