import merge from 'lodash-es/merge';

import { Logger } from '@uprtcl/micro-orchestrator';

import { Ready } from '../types/ready';

export interface ConnectionOptions {
  retries?: number;
  retryInterval?: number;
}

export enum ConnectionState {
  PENDING,
  SUCCESS,
  FAILED,
}

const defaultOptions: ConnectionOptions = {
  retries: 4,
  retryInterval: 200,
};

export abstract class Connection implements Ready {
  state: ConnectionState = ConnectionState.PENDING;
  connectionReady!: Promise<void>;
  connectionResolve!: () => void;
  connectionReject!: () => void;

  options: ConnectionOptions;

  logger = new Logger(this.constructor.name);

  constructor(options: ConnectionOptions = {}) {
    // Merge options
    if (options) this.options = merge(defaultOptions, options);
    else this.options = defaultOptions;

    this.setupConnection();

    // setTimeout needed here because we need the constructors to be executed before the connect call happens
    setTimeout(() => {
      this.connect()
        .then(() => this.success())
        .catch((e) => this.retry(e));
    });
  }

  /**
   * Prepares the class properties before connecting
   */
  private setupConnection(): void {
    this.state = ConnectionState.PENDING;
    this.connectionReady = new Promise<void>((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;
    });
  }

  /**
   * Opens the connection
   * To be overriden by subclasses
   */
  protected abstract async connect(): Promise<void>;

  /**
   * Waits until the connection is ready to process calls
   */
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

  /**
   * Connection succeeded, update state
   */
  private success(): void {
    this.logger.info('Connection established');
    this.state = ConnectionState.SUCCESS;
    this.connectionResolve();
  }

  /**
   * Retries to connect
   */
  protected retry(cause: any): void {
    let retryCount = 0;

    // If retries is negative we disable the retry mechanism
    if (!this.options.retries || this.options.retries < 0) {
      this.state = ConnectionState.FAILED;
      this.connectionReject();

      this.logger.warn(`Connection failed with cause `, cause, `, not retrying`);

      return;
    }

    this.logger.warn('Connection failed with cause ', cause, ' retrying...');

    // Reinitiate promise logic for ready function
    if (this.state !== ConnectionState.PENDING) {
      this.setupConnection();
    }

    this.logger.log('Retrying to connect');

    // Setup retry interval
    const retryInterval = setInterval(() => {
      this.connect()
        .then(() => {
          // Connection reestablished
          clearInterval(retryInterval);
          this.success();
        })
        .catch(() => {
          retryCount++;
          if (retryCount === this.options.retries) {
            // Clear interval
            clearInterval(retryInterval);

            // Set state rejected
            this.state = ConnectionState.FAILED;
            this.connectionReject();

            this.logger.warn(
              `Retried to connect ${this.options.retries} times and failed, stopping`
            );
          }
        });
    }, this.options.retryInterval);
  }
}
