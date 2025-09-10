import { createContainer, asClass, asFunction, InjectionMode } from 'awilix';

import { OnionConfig } from '../../Domain/Entities/OnionConfig';
import { AwilixConfig } from '../../Domain/Entities/AwilixConfig';
import { OnionConfigRepository } from '../../Infrastructure/Repositories/OnionConfigRepository';
import { OnionConfigService } from '../../Domain/Services/OnionConfigService';
import { OnionConfigStateService } from '../../Domain/Services/OnionConfigStateService';
import { OnionConfigNodeService } from '../../Domain/Services/OnionConfigNodeService';
import { OnionConfigValidationService } from '../../Domain/Services/OnionConfigValidationService';
import { OnionConfigRepositoryService } from '../../Domain/Services/OnionConfigRepositoryService';
import { DiagramAppService } from '../../Application/Services/DiagramAppService';
import { DiagramNodeInteractionAppService } from '../../Application/Services/DiagramNodeInteractionAppService';
import { DiagramNodeManagementService } from '../../Application/Services/DiagramNodeManagementAppService';
import { DiagramConnectionAppService } from '../../Application/Services/DiagramConnectionAppService';
import { DiagramProjectGenerationService } from '../../Application/Services/DiagramProjectGenerationAppService';
import { HelpAppService } from '../../Application/Services/HelpAppService';
import { AwilixConfigService } from '../../Domain/Services/AwilixConfigService';
import { ShowcaseService } from '../../Domain/Services/ShowcaseService';
import { EntityService } from '../../Domain/Services/EntitityService';
import { DomainServiceService } from '../../Domain/Services/DomainServiceService';
import { RepoService } from '../../Domain/Services/RepoService';
import { ApplicationServiceService } from '../../Domain/Services/ApplicationServiceService';
import { BrowserCheckAppService } from '../../Application/Services/BrowserCheckAppService';
import { FileService } from '../../Domain/Services/FileService';
import { FolderStructureService } from '../../Application/Services/FolderGenAppService';
import { PathAppService } from '../../Application/Services/PathAppService';
import { WebContainerPathRepository } from '../Repositories/WebContainerPathRepository';
import { IRepoService } from '../../Domain/Services/IRepoService';
import { ZipAppService } from '../../Application/Services/ZipAppService';
import { WebContainerFileRepository } from '../Repositories/WebContainerFileRepository';
import { WebContainerOptimizedProjectAppService } from '../../Application/Services/WebContainerOptimizedProjectAppService';
import { WebContainerAppService } from '../../Application/Services/WebContainerAppService';
import { NodeCommandRunner } from '../Repositories/NodeCommandRunner';
import { WebContainerCommandRunnerService } from '../Repositories/WebContainerCommandRunnerService';
import { WebContainerHelperFunctions } from '../Repositories/WebContainerHelperFunctions';
import { ProjectDownloadAppService } from '../../Application/Services/ProjectDownloadAppService';
import { ProgressTrackingAppService } from '../../Application/Services/ProgressTrackingAppService';
import { OnionConfigConnectionAppService } from '../../Application/Services/OnionConfigConnectionAppService';
import { AngularConfigAppService } from '../../Application/Services/AngularConfigAppService';
import { ConfigurationAppService } from '../../Application/Services/ConfigurationAppService';
import { LintAppService } from '../../Application/Services/LintAppService';
import { DiagramConfigurationAppService } from '../../Application/Services/DiagramConfigurationAppService';
import { DiagramPositionCalculatorAppService } from '../../Application/Services/DiagramPositionCalculatorAppService';
import { DiagramSVGRendererAppService } from '../../Application/Services/DiagramSVGRendererAppService';
import { ProjectGenerationOrchestratorAppService } from '../../Application/Services/ProjectGenerationOrchestratorAppService';
import { OnionAppService } from '../../Application/Services/OnionAppService';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

const browserService = new BrowserCheckAppService();

container.register({
  generationOrchestrator: asClass(
    ProjectGenerationOrchestratorAppService
  ).singleton(),
  onionAppService: asClass(OnionAppService).singleton(),
  onionConfig: asClass(OnionConfig).singleton(),
  awilixConfig: asClass(AwilixConfig).singleton(),
  helpAppService: asClass(HelpAppService).singleton(),
  entityService: asClass(EntityService).singleton(),
  domainServiceService: asClass(DomainServiceService).singleton(),
  iRepoService: asClass(IRepoService).singleton(),
  fileService: asClass(FileService).singleton(),
  showcaseService: asClass(ShowcaseService).singleton(),
  folderStructureService: asClass(FolderStructureService).singleton(),
  repoService: asClass(RepoService).singleton(),
  awilixCfgService: asClass(AwilixConfigService).singleton(),
  angularConfigAppService: asClass(AngularConfigAppService).singleton(),
  configurationAppService: asClass(ConfigurationAppService).singleton(),

  // OnionConfig services decomposition
  onionConfigStateService: asClass(OnionConfigStateService).singleton(),
  nodeService: asClass(OnionConfigNodeService).singleton(),
  onionConfigConnectionAppService: asClass(
    OnionConfigConnectionAppService
  ).singleton(),
  connectionValidator: asClass(OnionConfigConnectionAppService).singleton(),
  onionConfigValidationService: asClass(
    OnionConfigValidationService
  ).singleton(),
  onionConfigRepositoryService: asClass(
    OnionConfigRepositoryService
  ).singleton(),
  onionConfigService: asClass(OnionConfigService).singleton(),

  onionConfigRepository: asClass(OnionConfigRepository).singleton(),
  applicationServiceService: asClass(ApplicationServiceService).singleton(),
  diagramAppService: asClass(DiagramAppService).singleton(),
  diagramConfigurationAppService: asClass(
    DiagramConfigurationAppService
  ).singleton(),
  diagramPositionCalculatorAppService: asClass(
    DiagramPositionCalculatorAppService
  ).singleton(),
  diagramSVGRendererAppService: asClass(
    DiagramSVGRendererAppService
  ).singleton(),
  diagramNodeInteractionService: asClass(
    DiagramNodeInteractionAppService
  ).singleton(),
  diagramNodeManagementService: asClass(
    DiagramNodeManagementService
  ).singleton(),
  diagramConnectionService: asClass(DiagramConnectionAppService).singleton(),
  diagramProjectGenerationService: asClass(
    DiagramProjectGenerationService
  ).singleton(),
  pathService: asClass(PathAppService).singleton(),
  browserCheckAppService: asClass(BrowserCheckAppService).singleton(),
  progressTrackingAppService: asClass(ProgressTrackingAppService).singleton(),
  repositoryService: asClass(OnionConfigRepositoryService).singleton(),
  validationService: asClass(OnionConfigValidationService).singleton(),
  stateService: asClass(OnionConfigStateService).singleton(),
  configService: asClass(OnionConfigService).singleton(),
  lintAppService: asClass(LintAppService).singleton(),
});

// Register file repository based on environment
if (browserService.isNode()) {
  container.register({
    commandRunner: asClass(NodeCommandRunner).singleton(),
  });
} else if (browserService.isBrowser()) {
  container.register({
    fileRepository: asClass(WebContainerFileRepository).singleton(),
    webContainerRepository: asClass(WebContainerFileRepository).singleton(),
    pathRepository: asClass(WebContainerPathRepository).singleton(),
    projectService: asClass(WebContainerOptimizedProjectAppService).singleton(),
    commandRunner: asClass(WebContainerCommandRunnerService).singleton(),
    webContainerService: asClass(WebContainerAppService).singleton(),

    // WebContainer can usually not be imported into node.js environments,
    // so we use a proxy to lazy-load the service when needed
    webContainerManager: asFunction(() => {
      // Create a proxy that lazy-loads the actual service
      type WebContainerManagerInstance = {
        initialize(): Promise<unknown>;
        reset(): Promise<void>;
        isReady(): boolean;
        getWebContainer(): unknown;
      };

      let serviceInstance: WebContainerManagerInstance | null = null;

      const loadService = async () => {
        if (!serviceInstance) {
          const { WebContainerManagerAppService } = await import(
            '../../Application/Services/WebContainerManagerAppService'
          );
          serviceInstance = new WebContainerManagerAppService();
        }
        return serviceInstance;
      };

      // Return a proxy that looks like the service but lazy-loads it
      return new Proxy(
        {},
        {
          get(_target, prop) {
            if (prop === 'initialize') {
              return async () => {
                const service = await loadService();
                return service.initialize();
              };
            }
            if (prop === 'reset') {
              return async () => {
                const service = await loadService();
                return service.reset();
              };
            }
            if (prop === 'isReady') {
              return async () => {
                const service = await loadService();
                return service.isReady();
              };
            }
            if (prop === 'getWebContainer') {
              return async () => {
                const service = await loadService();
                return service.getWebContainer();
              };
            }
            // For unknown methods, return undefined
            return undefined;
          },
        }
      );
    }).singleton(),
    helperFunctions: asClass(WebContainerHelperFunctions).singleton(),
    downloadService: asClass(ProjectDownloadAppService).singleton(),
    projectDownloadService: asClass(ProjectDownloadAppService).singleton(),
    zipService: asClass(ZipAppService).singleton(),
  });
} else {
  console.log('Unknown environment, no Runtime Environement detected');
}

export { container };
