export interface EntropyGenerator {
  get: () => Promise<string>;
}
