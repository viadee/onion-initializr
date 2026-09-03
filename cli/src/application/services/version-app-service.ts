import { CLI_VERSION } from '../configuration/generated-version';

export class VersionAppService {
  async handleVersion(): Promise<void> {
    if (process.argv.includes('--version') || process.argv.includes('-v')) {
      console.log(`Onion Architecture Generator v${CLI_VERSION}`);
      process.exit(0);
    }
  }
}
