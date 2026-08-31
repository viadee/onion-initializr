import { PathAppService } from '@onion-initializr/lib/application/services/path-app-service';
import { FileService } from '@onion-initializr/lib/domain/services/file-service';

export class VersionAppService {
  constructor(
    private fileService: FileService,
    private pathService: PathAppService
  ) {}

  async handleVersion(): Promise<void> {
    if (process.argv.includes('--version') || process.argv.includes('-v')) {
      const packageJsonPath = this.pathService.join(
        __dirname,
        '../../../../package.json'
      );

      const originalPackageJson =
        await this.fileService.readFile(packageJsonPath);

      const parsedPackageJson = JSON.parse(originalPackageJson.content);
      const onionVersion = parsedPackageJson.version;
      console.log(`Onion Architecture Generator v${onionVersion}`);
      process.exit(0);
    }
  }
}
