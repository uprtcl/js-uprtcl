export interface AccessControlInformation<T> {
  readable: boolean;
  writable: boolean;
  information: T;
}
