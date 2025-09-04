import { OnionConfig } from '../../Domain/Entities/OnionConfig';
import { WebContainerAppService } from './WebContainerAppService';
import {
  ProgressTrackingAppService,
  ProgressStep,
} from './ProgressTrackingAppService';
import { UIFrameworks } from '../../Domain/Entities/UiFramework';
import { DiFramework } from '../../Domain/Entities/DiFramework';

export interface ProjectGenerationResult {
  success: boolean;
  message: string;
  filesCreated?: string[];
  applicationUrl?: string;
}

export interface CrossOriginStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

export class DiagramProjectGenerationService {
  constructor(
    private readonly webContainerService: WebContainerAppService,
    private readonly progressTrackingAppService: ProgressTrackingAppService
  ) {}

  validateProjectGeneration(data: OnionConfig): {
    isValid: boolean;
    errorMessage?: string;
  } {
    if (!data?.entities?.length) {
      return {
        isValid: false,
        errorMessage:
          'Please configure at least one entity before generating the project.',
      };
    }
    return { isValid: true };
  }

  createProgressSteps(): ProgressStep[] {
    return [
      {
        id: 'init-webcontainer',
        label: 'Initializing WebContainer environment...',
        weight: 2, // ~1s - very fast
        completed: false,
      },
      {
        id: 'npm-init',
        label: 'Initializing npm project...',
        weight: 2, // ~1s - very fast
        completed: false,
      },
      {
        id: 'install-dev-deps',
        label: 'Installing development dependencies...',
        weight: 30, // ~18s - long operation
        completed: false,
      },
      {
        id: 'create-framework',
        label: 'Creating UI framework project',
        weight: 18, // ~3.5s - moderate
        completed: false,
      },
      {
        id: 'move-files',
        label: 'Setting up project structure...',
        weight: 2, // ~0.5s - very fast (part of create-framework)
        completed: false,
      },
      {
        id: 'generate-architecture',
        label: 'Generating onion architecture files...',
        weight: 16, // ~10s - significant time
        completed: false,
      },
      {
        id: 'create-download',
        label: 'Creating ZIP download package...',
        weight: 2, // ~0.3s - very fast
        completed: false,
      },
    ];
  }

  async generateProject(
    data: OnionConfig,
    selectedFramework: keyof UIFrameworks,
    selectedDiFramework: DiFramework
  ): Promise<ProjectGenerationResult> {
    try {
      // Update framework selection
      data.uiFramework = selectedFramework;
      data.diFramework = selectedDiFramework;

      // Start the generation process with progress reporting
      const result = await this.webContainerService.generateOnionArchitecture(
        data,
        (stepId: string, progress?: number) => {
          if (progress !== undefined) {
            this.progressTrackingAppService.updateStepProgress(
              stepId,
              progress
            );
            if (progress === 100) {
              this.progressTrackingAppService.completeStep(stepId);
            }
            return;
          }

          this.progressTrackingAppService.startStep(stepId);
        }
      );

      if (!result.success) {
        this.progressTrackingAppService.setError(
          'framework-setup',
          result.message
        );
        return {
          success: false,
          message: result.message,
        };
      }

      this.progressTrackingAppService.complete();
      return {
        success: true,
        message: 'Project generated successfully',
        filesCreated: result.filesCreated,
        applicationUrl: result.applicationUrl,
      };
    } catch (error) {
      let errorMessage: string = 'Unexpected error occurred';

      // Check for cross-origin isolation error
      if (
        error instanceof Error &&
        error.message.includes('cross-origin isolation')
      ) {
        errorMessage =
          'WebContainer requires cross-origin isolation. Please restart the Angular dev server.';
      }

      this.progressTrackingAppService.setError('framework-setup', errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async downloadProject(): Promise<ProjectGenerationResult> {
    this.progressTrackingAppService.startStep('create-download');

    try {
      const downloadResult = await this.webContainerService.downloadProject();

      if (!downloadResult.success) {
        this.progressTrackingAppService.setError(
          'create-download',
          downloadResult.message
        );
        return {
          success: false,
          message: 'Project generated but download failed',
        };
      }

      this.progressTrackingAppService.completeStep('create-download');
      this.progressTrackingAppService.complete();

      return {
        success: true,
        message: 'Download completed successfully!',
      };
    } catch (error) {
      console.error('Error during project download:', error);
      this.progressTrackingAppService.setError(
        'create-download',
        'Failed to create download package'
      );
      return {
        success: false,
        message: 'Project generated but download failed',
      };
    }
  }

  getCrossOriginStatus(): CrossOriginStatus {
    if (window.crossOriginIsolated) {
      return {
        type: 'success',
        message: 'Cross-origin isolation enabled - WebContainer ready',
      };
    } else {
      return {
        type: 'error',
        message:
          'Cross-origin isolation required - Please restart the development server',
      };
    }
  }

  get isCrossOriginIsolated(): boolean {
    return window.crossOriginIsolated || false;
  }
}
