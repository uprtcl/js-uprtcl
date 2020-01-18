export interface Ready {
  /**
   * Waits until the connection is ready to process calls
   */
  ready(): Promise<void>;
}
