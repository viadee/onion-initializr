import { OnionConfig } from '../../Domain/Entities/OnionConfig';
import { WebContainerFileRepository } from '../../Infrastructure/Repositories/WebContainerFileRepository';

import { WebContainerManagerAppService } from './WebContainerManagerAppService';

import {
  ProjectDownloadAppService,
  DownloadResult,
} from './ProjectDownloadAppService';
import { ProjectGenerationOrchestratorAppService } from './ProjectGenerationOrchestratorAppService';

/**
 * Main service that coordinates WebContainer operations
 * Delegates specific responsibilities to focused services
 */
export class WebContainerAppService {
  constructor(
    private readonly fileRepository: WebContainerFileRepository,
    private readonly webContainerManager: WebContainerManagerAppService,
    private readonly generationOrchestrator: ProjectGenerationOrchestratorAppService,
    private readonly downloadService: ProjectDownloadAppService
  ) {}

  /**
   * Initialize WebContainer
   */
  async initializeWebContainer(): Promise<void> {
    await this.webContainerManager.initialize();
  }

  /**
   * Generate Onion Architecture in WebContainer
   */
  async generateOnionArchitecture(
    config: OnionConfig,
    progressCallback?: any
  ): Promise<any> {
    return await this.generationOrchestrator.generateProject(
      config,
      progressCallback
    );
  }

  /**
   * Download the generated project as a ZIP file
   */
  async downloadProject(): Promise<DownloadResult> {
    return await this.downloadService.downloadProject();
  }

  /**
   * Reset WebContainer and clear all data
   */
  async resetWebContainer(): Promise<void> {
    await this.fileRepository.resetWebContainer();
    await this.webContainerManager.reset();
  }

  /**
   * Check if WebContainer is initialized and ready
   */
  isWebContainerReady(): boolean {
    return this.webContainerManager.isReady();
  }
}
