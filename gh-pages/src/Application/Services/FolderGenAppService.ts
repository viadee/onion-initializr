import { FileService } from '../../Domain/Services/FileService';
import { PathAppService } from './PathAppService';

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
      'src/Domain',
      'src/Domain/Entities',
      'src/Domain/Interfaces',
      'src/Domain/Services',
      'src/Application',
      'src/Application/Services',
      'src/Infrastructure',
      'src/Infrastructure/Configuration',
      'src/Infrastructure/Repositories',
      'src/Infrastructure/Presentation',
      'src/Tests',
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
