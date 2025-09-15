import { WebContainerFileRepository } from '../../../../gh-pages/src/Infrastructure/Repositories/WebContainerFileRepository';
import { OnionCliAppService } from './OnionCliAppService';
import { WebContainerManagerAppService } from '../../../../gh-pages/src/Application/Services/WebContainerManagerAppService';
import { WebContainerOptimizedProjectAppService } from '../../../../gh-pages/src/Application/Services/WebContainerOptimizedProjectAppService';
import { OnionConfig } from '../../../../lib/Domain/Entities/OnionConfig';

export interface GenerationResult {
  success: boolean;
  message: string;
  filesCreated?: string[];
  applicationUrl?: string;
}

export type ProgressCallback = (stepId: string, progress?: number) => void;

/**
 * Orchestrates the complete project generation process
 */
export class ProjectGenerationOrchestratorAppService {
  constructor(
    private readonly webContainerManager: WebContainerManagerAppService,
    private readonly fileRepository: WebContainerFileRepository,
    private readonly projectService: WebContainerOptimizedProjectAppService,
    private readonly onionCliAppService: OnionCliAppService
  ) {}

  async generateProject(
    config: OnionConfig,
    progressCallback?: ProgressCallback
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    console.log('🚀 Starting WebContainer Onion Architecture generation...');

    try {
      console.log('diFramework selected:', config.diFramework);
      await this.initializeEnvironment(progressCallback);
      await this.setupFramework(config, progressCallback);
      await this.generateArchitecture(config, progressCallback);
      const result = await this.finalizeProject(progressCallback);

      const totalTime = Date.now() - startTime;
      console.log(
        `🎉 WebContainer generation completed in ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`
      );

      return {
        success: true,
        message: `Onion Architecture generated successfully in WebContainer! (${(totalTime / 1000).toFixed(2)}s)`,
        ...result,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(
        `❌ Failed to generate Onion Architecture after ${totalTime}ms:`,
        error
      );

      return {
        success: false,
        message: `Failed to generate: ${error}`,
      };
    }
  }

  private async initializeEnvironment(
    progressCallback?: ProgressCallback
  ): Promise<void> {
    progressCallback?.('init-webcontainer');

    const webcontainer = await this.webContainerManager.initialize();
    this.fileRepository.setWebContainer(webcontainer);
    await this.fileRepository.initializeWebContainer(webcontainer);

    const projectFolder = '/onion-project';
    await this.cleanupExistingProject(projectFolder);
    await this.fileRepository.createDirectory(projectFolder);

    progressCallback?.('init-webcontainer', 100);
  }

  private async setupFramework(
    config: OnionConfig,
    progressCallback?: ProgressCallback
  ): Promise<void> {
    const frameworkStart = Date.now();
    console.log('🏗️ Setting up UI framework (this may take 20-30 seconds)...');

    const initResult = await this.projectService.initialize(
      '/onion-project',
      config.uiFramework,
      config.diFramework,
      this.createFrameworkProgressHandler(progressCallback)
    );

    if (!initResult) {
      throw new Error('Failed to initialize framework');
    }

    console.log(
      `✅ Framework setup completed (${Date.now() - frameworkStart}ms)`
    );
  }

  private async generateArchitecture(
    config: OnionConfig,
    progressCallback?: ProgressCallback
  ): Promise<void> {
    progressCallback?.('generate-architecture');
    const onionGenStart = Date.now();
    console.log('🧅 Generating onion architecture files...');

    await this.onionCliAppService.generateOnionArchitecture({
      folderPath: '/onion-project',
      entityNames: config.entities || [],
      domainServiceNames: config.domainServices || [],
      applicationServiceNames: config.applicationServices || [],
      uiFramework: config.uiFramework || 'react',
      diFramework: config.diFramework || 'awilix',
      domainServiceConnections: config.domainServiceConnections || {},
      applicationServiceDependencies:
        config.applicationServiceDependencies || {},
      skipProjectInit: false,
    });

    console.log(
      `✅ Architecture generation completed (${Date.now() - onionGenStart}ms)`
    );
    progressCallback?.('generate-architecture', 100);
  }

  private async finalizeProject(
    progressCallback?: ProgressCallback
  ): Promise<string[]> {
    progressCallback?.('create-download');

    const filesCreated = this.fileRepository.getBrowserFiles();

    return filesCreated;
  }

  private async cleanupExistingProject(projectFolder: string): Promise<void> {
    try {
      await this.fileRepository.rmSync(projectFolder);
    } catch {
      // Ignore if folder doesn't exist
    }
  }

  private createFrameworkProgressHandler(progressCallback?: ProgressCallback) {
    return (phase: string, progress: number) => {
      const phaseMap = {
        'npm-init': 'npm-init',
        'install-dev-deps': 'install-dev-deps',
        'create-framework': 'create-framework',
        'move-files': 'move-files',
        'install-awilix': 'install-awilix',
      };

      const stepId = phaseMap[phase as keyof typeof phaseMap];
      if (stepId) {
        progressCallback?.(stepId, progress);
      }
    };
  }
}
