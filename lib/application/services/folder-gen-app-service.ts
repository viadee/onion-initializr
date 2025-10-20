import { FileService } from '../../Domain/Services/file-service';
import { PathAppService } from './path-app-service';

/**
 * Service class to create the base folder structure.
 */
export class FolderStructureService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}

  async createFolderStructure(folderPath: string) {
    const structure = [
      'src',
      'src/domain',
      'src/domain/entities',
      'src/domain/interfaces',
      'src/domain/services',
      'src/application',
      'src/application/services',
      'src/infrastructure',
      'src/infrastructure/configuration',
      'src/infrastructure/repositories',
      'src/infrastructure/presentation',
      'src/tests',
    ];
    await this.fileService.createDirectory(folderPath);

    structure.forEach(async dir => {
      const dirPath = this.pathService.join(folderPath, dir);
      if (await this.fileService.fileExists(dirPath)) {
        return;
      }

      console.log(`Creating directory: ${dirPath}`);
      await this.fileService.createDirectory(dirPath);
    });
  }
}
