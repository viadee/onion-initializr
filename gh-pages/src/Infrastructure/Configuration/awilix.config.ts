import { OnionConfigConnectionAppService } from './../../../../lib/Application/Services/OnionConfigConnectionAppService';
import { LintAppService } from './../../../../lib/Application/Services/LintAppService';
import { HelpAppService } from '../../Application/Services/HelpAppService';
import { createContainer, asClass, asFunction, InjectionMode } from 'awilix';
import { OnionConfigRepository } from '../../Infrastructure/Repositories/OnionConfigRepository';
import { OnionConfigService } from '../../../../lib/Domain/Services/OnionConfigService';
import { OnionConfigStateService } from '../../../../lib/Domain/Services/OnionConfigStateService';
import { OnionConfigNodeService } from '../../../../lib/Domain/Services/OnionConfigNodeService';
import { OnionConfigValidationService } from '../../../../lib/Domain/Services/OnionConfigValidationService';
import { OnionConfigRepositoryService } from '../../../../lib/Domain/Services/OnionConfigRepositoryService';
import { AngularConfigAppService } from '../../../../lib/Application/Services/AngularConfigAppService';
import { BrowserCheckAppService } from '../../../../lib/Application/Services/BrowserCheckAppService';
import { ConfigurationAppService } from '../../../../lib/Application/Services/ConfigurationAppService';
import { FolderStructureService } from '../../../../lib/Application/Services/FolderGenAppService';
import { OnionAppService } from '../../../../lib/Application/Services/OnionAppService';
import { PathAppService } from '../../../../lib/Application/Services/PathAppService';
import { ProjectDownloadAppService } from '../../../../lib/Application/Services/ProjectDownloadAppService';
import { ProjectGenerationOrchestratorAppService } from '../../../../lib/Application/Services/ProjectGenerationOrchestratorAppService';
import { ApplicationServiceService } from '../../../../lib/Domain/Services/ApplicationServiceService';
import { AwilixConfigService } from '../../../../lib/Domain/Services/AwilixConfigService';
import { DomainServiceService } from '../../../../lib/Domain/Services/DomainServiceService';
import { EntityService } from '../../../../lib/Domain/Services/EntitityService';
import { FileService } from '../../../../lib/Domain/Services/FileService';
import { IRepoService } from '../../../../lib/Domain/Services/IRepoService';
import { RepoService } from '../../../../lib/Domain/Services/RepoService';
import { ShowcaseService } from '../../../../lib/Domain/Services/ShowcaseService';
import { DiagramAppService } from '../../Application/Services/DiagramAppService';
import { DiagramConfigurationAppService } from '../../Application/Services/DiagramConfigurationAppService';
import { DiagramConnectionAppService } from '../../Application/Services/DiagramConnectionAppService';
import { DiagramNodeInteractionAppService } from '../../Application/Services/DiagramNodeInteractionAppService';
import { DiagramNodeManagementService } from '../../Application/Services/DiagramNodeManagementAppService';
import { DiagramPositionCalculatorAppService } from '../../Application/Services/DiagramPositionCalculatorAppService';
import { DiagramProjectGenerationService } from '../../Application/Services/DiagramProjectGenerationAppService';
import { DiagramSVGRendererAppService } from '../../Application/Services/DiagramSVGRendererAppService';
import { ProgressTrackingAppService } from '../../Application/Services/ProgressTrackingAppService';
import { WebContainerAppService } from '../../Application/Services/WebContainerAppService';
import { WebContainerOptimizedProjectAppService } from '../../Application/Services/WebContainerOptimizedProjectAppService';
import { ZipAppService } from '../../Application/Services/ZipAppService';
import { NodeCommandRunner } from '../Repositories/NodeCommandRunner';
import { WebContainerCommandRunnerService } from '../Repositories/WebContainerCommandRunnerService';
import { WebContainerFileRepository } from '../Repositories/WebContainerFileRepository';
import { WebContainerHelperFunctions } from '../Repositories/WebContainerHelperFunctions';
import { WebContainerPathRepository } from '../Repositories/WebContainerPathRepository';
import { AwilixConfig } from '../../../../lib/Domain/Entities/AwilixConfig';
import { OnionConfig } from '../../../../lib/Domain/Entities/OnionConfig';

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
