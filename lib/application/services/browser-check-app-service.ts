/**
 * Service for file and directory operations.
 */
export class BrowserCheckAppService {
  isNode(): boolean {
    return (
      typeof process !== 'undefined' &&
      typeof process.versions?.node !== 'undefined'
    );
  }
  isBrowser(): boolean {
    return (
      typeof globalThis !== 'undefined' &&
      'window' in globalThis &&
      'document' in (globalThis as any).window
    );
  }
}
