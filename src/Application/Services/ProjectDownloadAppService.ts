import { WebContainerFileRepository } from '../../Infrastructure/Repositories/WebContainerFileRepository';
import { ZipAppService } from './ZipAppService';
import { FileEntity } from '../../Domain/Entities/FileEntity';

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

  async downloadProject(): Promise<DownloadResult> {
    try {
      console.log('Preparing project download...');

      const projectFiles = await this.getProjectFiles();
      if (projectFiles.length === 0) {
        return {
          success: false,
          message: 'No project files found to download',
        };
      }

      const zipFileName = this.generateZipFileName();
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

  private generateZipFileName(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    return `onion-architecture-project-${timestamp}.zip`;
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
