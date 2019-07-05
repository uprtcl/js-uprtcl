export enum ConnectionState {
  PENDING,
  SUCCESS,
  FAILED
}

export class Connection {
  state: ConnectionState = ConnectionState.PENDING;
  connectionReady!: Promise<void>;
  connectionResolve!: () => void;
  connectionReject!: () => void;

  constructor(protected retries: number = 4, protected retryInterval: number = 1000) {
    this.initConnection();

    setTimeout(() => {
      this.connect()
        .then(() => {
          console.log('connection established');
          this.state = ConnectionState.SUCCESS;
          this.connectionResolve();
        })
        .catch(() => {
          console.log('Connection failed, retrying...');
          this.retry();
        });
    });
  }

  private initConnection() {
    this.connectionReady = new Promise<void>((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;
    });
  }

  protected async connect(): Promise<void> {
    throw new Error('Method not implemented');
  }

  public ready(): Promise<void> {
    switch (this.state) {
      case ConnectionState.PENDING:
        return this.connectionReady;
      case ConnectionState.FAILED:
        return Promise.reject();
      case ConnectionState.SUCCESS:
        return Promise.resolve();
    }
  }

  protected retry(): void {
    let retryCount = 0;

    const retryInterval = setInterval(() => {
      this.connect()
        .then(() => {
          clearInterval(retryInterval);
          this.state = ConnectionState.SUCCESS;
          this.connectionResolve();
        })
        .catch(() => {
          retryCount++;
          if (retryCount === this.retries) {
            clearInterval(retryInterval);
            console.log(`Retried to connect ${this.retries} times and failed, stopping`);
            this.state = ConnectionState.FAILED;
            this.connectionReject();
          }
        });
    }, this.retryInterval);
  }
}
