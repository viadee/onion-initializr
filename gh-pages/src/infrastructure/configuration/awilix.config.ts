import { createContainer, asClass, asFunction, InjectionMode } from 'awilix';
import { OnionConfigService } from '../../../../lib/domain/services/onion-config-service';
import { OnionConfigStateService } from '../../../../lib/domain/services/onion-config-state-service';
import { OnionConfigNodeService } from '../../../../lib/domain/services/onion-config-node-service';
import { OnionConfigValidationService } from '../../../../lib/domain/services/onion-config-validation-service';
import { OnionConfigRepositoryService } from '../../../../lib/domain/services/onion-config-repository-service';
import { AngularConfigAppService } from '../../../../lib/application/services/angular-config-app-service';
import { BrowserCheckAppService } from '../../../../lib/application/services/browser-check-app-service';
import { ConfigurationAppService } from '../../../../lib/application/services/configuration-app-service';
import { FolderStructureService } from '../../../../lib/application/services/folder-gen-app-service';
import { OnionAppService } from '../../../../lib/application/services/onion-app-service';
import { PathAppService } from '../../../../lib/application/services/path-app-service';
import { ProjectDownloadAppService } from '../../../../lib/application/services/project-download-app-service';
import { ProjectGenerationOrchestratorAppService } from '../../../../lib/application/services/project-generation-orchestrator-app-service';
import { ApplicationServiceService } from '../../../../lib/domain/services/application-service-service';
import { AwilixConfigService } from '../../../../lib/domain/services/awilix-config-service';
import { DomainServiceService } from '../../../../lib/domain/services/domain-service-service';
import { EntityService } from '../../../../lib/domain/services/entitity-service';
import { FileService } from '../../../../lib/domain/services/file-service';
import { IRepoService } from '../../../../lib/domain/services/irepo-service';
import { RepoService } from '../../../../lib/domain/services/repo-service';
import { ShowcaseService } from '../../../../lib/domain/services/showcase-service';
import { DiagramAppService } from '../../application/services/diagram-app-service';
import { DiagramConfigurationAppService } from '../../application/services/diagram-configuration-app-service';
import { DiagramConnectionAppService } from '../../application/services/diagram-connection-app-service';
import { DiagramNodeInteractionAppService } from '../../application/services/diagram-node-interaction-app-service';
import { DiagramNodeManagementService } from '../../application/services/diagram-node-management-app-service';
import { DiagramPositionCalculatorAppService } from '../../application/services/diagram-position-calculator-app-service';
import { DiagramProjectGenerationService } from '../../application/services/diagram-project-generation-app-service';
import { DiagramSVGRendererAppService } from '../../application/services/diagram-svgrenderer-app-service';
import { ProgressTrackingAppService } from '../../application/services/progress-tracking-app-service';
import { WebContainerAppService } from '../../application/services/web-container-app-service';
import { WebContainerOptimizedProjectAppService } from '../../application/services/web-container-optimized-project-app-service';
import { ZipAppService } from '../../application/services/zip-app-service';
import { WebContainerCommandRunnerService } from '../repositories/web-container-command-runner-service';
import { WebContainerFileRepository } from '../repositories/web-container-file-repository';
import { WebContainerHelperFunctions } from '../repositories/web-container-helper-functions';
import { WebContainerPathRepository } from '../repositories/web-container-path-repository';
import { AwilixConfig } from '../../../../lib/domain/entities/awilix-config';
import { OnionConfig } from '../../../../lib/domain/entities/onion-config';
import { InputSanitizationService } from '../../application/services/input-sanitization-service';
import { UILibrarySetupService } from '../../../../lib/application/services/uilibrary-setup-service';
import { LintAppService } from '../../../../lib/application/services/lint-app-service';
import { OnionConfigConnectionAppService } from '../../../../lib/application/services/onion-config-connection-app-service';
import { OnionConfigRepository } from '../repositories/onion-config-repository';

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
          '../../application/services/web-container-manager-app-service'
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
