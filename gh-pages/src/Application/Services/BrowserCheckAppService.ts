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
      typeof window !== 'undefined' && typeof window.document !== 'undefined'
    );
  }
}
