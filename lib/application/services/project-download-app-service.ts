
import { ZipAppService } from '../../../gh-pages/src/application/services/zip-app-service';
import { WebContainerFileRepository } from '../../../gh-pages/src/infrastructure/repositories/web-container-file-repository';
import { FileEntity } from '../../domain/entities/file-entity';

export interface DownloadResult {
  success: boolean;
  message: string;
}

/**
 * Handles project download functionality
 */
export class ProjectDownloadAppService {
  constructor(
    private readonly fileRepository: WebContainerFileRepository,
    private readonly zipService: ZipAppService
  ) {}

  async downloadProject(projectName?: string): Promise<DownloadResult> {
    try {
      console.log('Preparing project download...');

      const projectFiles = await this.getProjectFiles();
      if (projectFiles.length === 0) {
        return {
          success: false,
          message: 'No project files found to download',
        };
      }

      const zipFileName = this.generateZipFileName(projectName);
      await this.createAndDownloadZip(projectFiles, zipFileName);

      console.log(`Downloaded project with ${projectFiles.length} files`);

      return {
        success: true,
        message: `Project downloaded successfully (${projectFiles.length} files)`,
      };
    } catch (error) {
      console.error('Failed to download project:', error);
      return {
        success: false,
        message: `Failed to prepare download: ${error}`,
      };
    }
  }

  private async getProjectFiles(): Promise<
    Array<{ path: string; content: string }>
  > {
    return await this.fileRepository.getAllProjectFiles('/onion-project');
  }

  private generateZipFileName(projectName: string = 'onion-architecture-project'): string {
    // Sanitize the project name for use in filename
    const sanitizedName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-)|(-$)/g, '');
    
    return `${sanitizedName || 'onion-architecture-project'}.zip`;
  }

  private async createAndDownloadZip(
    projectFiles: Array<{ path: string; content: string }>,
    zipFileName: string
  ): Promise<void> {
    const fileEntities: FileEntity[] = projectFiles.map(
      file => new FileEntity(file.path, file.content)
    );

    await this.zipService.createAndDownloadZip(fileEntities, zipFileName);
  }
}
