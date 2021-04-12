export class ErrorWithCode extends Error {
  constructor(msg: string, protected code?: string) {
    super(msg);
  }
}
