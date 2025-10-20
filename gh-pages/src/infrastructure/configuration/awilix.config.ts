import { createContainer, asClass, asFunction, InjectionMode } from 'awilix';
import { OnionConfigService } from '../../../../lib/Domain/Services/onion-config-service';
import { OnionConfigStateService } from '../../../../lib/Domain/Services/onion-config-state-service';
import { OnionConfigNodeService } from '../../../../lib/Domain/Services/onion-config-node-service';
import { OnionConfigValidationService } from '../../../../lib/Domain/Services/onion-config-validation-service';
import { OnionConfigRepositoryService } from '../../../../lib/Domain/Services/onion-config-repository-service';
import { AngularConfigAppService } from '../../../../lib/Application/Services/angular-config-app-service';
import { BrowserCheckAppService } from '../../../../lib/Application/Services/browser-check-app-service';
import { ConfigurationAppService } from '../../../../lib/Application/Services/configuration-app-service';
import { FolderStructureService } from '../../../../lib/Application/Services/folder-gen-app-service';
import { OnionAppService } from '../../../../lib/Application/Services/onion-app-service';
import { PathAppService } from '../../../../lib/Application/Services/path-app-service';
import { ProjectDownloadAppService } from '../../../../lib/Application/Services/project-download-app-service';
import { ProjectGenerationOrchestratorAppService } from '../../../../lib/Application/Services/project-generation-orchestrator-app-service';
import { ApplicationServiceService } from '../../../../lib/Domain/Services/application-service-service';
import { AwilixConfigService } from '../../../../lib/Domain/Services/awilix-config-service';
import { DomainServiceService } from '../../../../lib/Domain/Services/domain-service-service';
import { EntityService } from '../../../../lib/Domain/Services/entitity-service';
import { FileService } from '../../../../lib/Domain/Services/file-service';
import { IRepoService } from '../../../../lib/Domain/Services/irepo-service';
import { RepoService } from '../../../../lib/Domain/Services/repo-service';
import { ShowcaseService } from '../../../../lib/Domain/Services/showcase-service';
import { DiagramAppService } from '../../Application/Services/diagram-app-service';
import { DiagramConfigurationAppService } from '../../Application/Services/diagram-configuration-app-service';
import { DiagramConnectionAppService } from '../../Application/Services/diagram-connection-app-service';
import { DiagramNodeInteractionAppService } from '../../Application/Services/diagram-node-interaction-app-service';
import { DiagramNodeManagementService } from '../../Application/Services/diagram-node-management-app-service';
import { DiagramPositionCalculatorAppService } from '../../Application/Services/diagram-position-calculator-app-service';
import { DiagramProjectGenerationService } from '../../Application/Services/diagram-project-generation-app-service';
import { DiagramSVGRendererAppService } from '../../Application/Services/diagram-svgrenderer-app-service';
import { ProgressTrackingAppService } from '../../Application/Services/progress-tracking-app-service';
import { WebContainerAppService } from '../../Application/Services/web-container-app-service';
import { WebContainerOptimizedProjectAppService } from '../../Application/Services/web-container-optimized-project-app-service';
import { ZipAppService } from '../../Application/Services/zip-app-service';
import { WebContainerCommandRunnerService } from '../Repositories/web-container-command-runner-service';
import { WebContainerFileRepository } from '../Repositories/web-container-file-repository';
import { WebContainerHelperFunctions } from '../Repositories/web-container-helper-functions';
import { WebContainerPathRepository } from '../Repositories/web-container-path-repository';
import { AwilixConfig } from '../../../../lib/Domain/Entities/awilix-config';
import { OnionConfig } from '../../../../lib/Domain/Entities/onion-config';
import { InputSanitizationService } from '../../Application/Services/input-sanitization-service';
import { UILibrarySetupService } from '../../../../lib/Application/Services/uilibrary-setup-service';
import { LintAppService } from '../../../../lib/Application/Services/lint-app-service';
import { OnionConfigConnectionAppService } from '../../../../lib/Application/Services/onion-config-connection-app-service';
import { OnionConfigRepository } from '../Repositories/onion-config-repository';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  generationOrchestrator: asClass(
    ProjectGenerationOrchestratorAppService
  ).singleton(),
  onionAppService: asClass(OnionAppService).singleton(),
  onionConfig: asClass(OnionConfig).singleton(),
  awilixConfig: asClass(AwilixConfig).singleton(),
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
  sanitizationService: asClass(InputSanitizationService).singleton(),
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
  inputSanitizationService: asClass(InputSanitizationService).singleton(),
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
  uiLibrarySetupService: asClass(UILibrarySetupService).singleton(),
});

// Register services for browser environment (web app only runs in browser)
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
          '../../Application/Services/web-container-manager-app-service'
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

export { container };
