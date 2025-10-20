import { createContainer, asClass, InjectionMode } from "awilix";

import { OnionConfigRepository } from "../../../../gh-pages/src/infrastructure/repositories/onion-config-repository";
import { OnionConfigService } from "../../../../lib/domain/services/onion-config-service";
import { OnionConfigStateService } from "../../../../lib/domain/services/onion-config-state-service";
import { OnionConfigNodeService } from "../../../../lib/domain/services/onion-config-node-service";
import { OnionConfigValidationService } from "../../../../lib/domain/services/onion-config-validation-service";
import { OnionConfigRepositoryService } from "../../../../lib/domain/services/onion-config-repository-service";
import { AwilixConfigService } from "../../../../lib/domain/services/awilix-config-service";
import { ShowcaseService } from "../../../../lib/domain/services/showcase-service";
import { EntityService } from "../../../../lib/domain/services/entitity-service";
import { DomainServiceService } from "../../../../lib/domain/services/domain-service-service";
import { RepoService } from "../../../../lib/domain/services/repo-service";
import { ApplicationServiceService } from "../../../../lib/domain/services/application-service-service";
import { FileService } from "../../../../lib/domain/services/file-service";
import { PathRepository } from "../repositories/path-repository";
import { IRepoService } from "../../../../lib/domain/services/irepo-service";
import { FileSystemFileRepository } from "../repositories/file-system-file-repository";
import { ScanControllerAppService } from "../../application/services/scan-controller-app-service";
import { ScannerAppService } from "../../application/services/scanner-app-service";
import { FileHelperAppService } from "../../application/services/file-helper-app-service";
import { OnionCliAppService } from "../../application/services/onion-cli-app-service";
import { AppServiceDependencyAppService } from "../../application/services/app-service-dependency-app-service";
import { ProjectInitAppService } from "../../application/services/project-init-app-service";
import { DiagramAppService } from "../../../../gh-pages/src/application/services/diagram-app-service";
import { DiagramConfigurationAppService } from "../../../../gh-pages/src/application/services/diagram-configuration-app-service";
import { DiagramConnectionAppService } from "../../../../gh-pages/src/application/services/diagram-connection-app-service";
import { DiagramNodeInteractionAppService } from "../../../../gh-pages/src/application/services/diagram-node-interaction-app-service";
import { DiagramNodeManagementService } from "../../../../gh-pages/src/application/services/diagram-node-management-app-service";
import { DiagramPositionCalculatorAppService } from "../../../../gh-pages/src/application/services/diagram-position-calculator-app-service";
import { DiagramProjectGenerationService } from "../../../../gh-pages/src/application/services/diagram-project-generation-app-service";
import { DiagramSVGRendererAppService } from "../../../../gh-pages/src/application/services/diagram-svgrenderer-app-service";
import { HelpAppService } from "../../application/services/help-app-service";
import { ProgressTrackingAppService } from "../../../../gh-pages/src/application/services/progress-tracking-app-service";
import { AngularConfigAppService } from "../../../../lib/application/services/angular-config-app-service";
import { BrowserCheckAppService } from "../../../../lib/application/services/browser-check-app-service";
import { ConfigurationAppService } from "../../../../lib/application/services/configuration-app-service";
import { FolderStructureService } from "../../../../lib/application/services/folder-gen-app-service";
import { PathAppService } from "../../../../lib/application/services/path-app-service";
import { OnionAppService } from "../../application/services/onion-app-service";
import { OnionConfigConnectionAppService } from "../../../../lib/application/services/onion-config-connection-app-service";
import { OnionConfig } from "../../../../lib/domain/entities/onion-config";
import { AwilixConfig } from "../../../../lib/domain/entities/awilix-config";
import { LintAppService } from "../../../../lib/application/services/lint-app-service";
import { RunCommandService } from "../repositories/run-command-service";
import { NodeCommandRunner } from "../repositories/node-command-runner";
import { UILibrarySetupService } from "../../../../lib/application/services/uilibrary-setup-service";

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  onionConfig: asClass(OnionConfig).singleton(),
  awilixConfig: asClass(AwilixConfig).singleton(),
  scanControllerService: asClass(ScanControllerAppService).singleton(),
  helpAppService: asClass(HelpAppService).singleton(),
  scannerService: asClass(ScannerAppService).singleton(),
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
  fileHelperService: asClass(FileHelperAppService).singleton(),

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
  pathRepository: asClass(PathRepository).singleton(),
  browserCheckAppService: asClass(BrowserCheckAppService).singleton(),
  onionCliAppService: asClass(OnionCliAppService).singleton(),
  progressTrackingAppService: asClass(ProgressTrackingAppService).singleton(),
  repositoryService: asClass(OnionConfigRepositoryService).singleton(),
  validationService: asClass(OnionConfigValidationService).singleton(),
  stateService: asClass(OnionConfigStateService).singleton(),
  onionAppService: asClass(OnionAppService).singleton(),
  appServiceDependencyAppService: asClass(
    AppServiceDependencyAppService
  ).singleton(),
  configService: asClass(OnionConfigService).singleton(),
  lintAppService: asClass(LintAppService).singleton(),
  uiLibrarySetupService: asClass(UILibrarySetupService).singleton(),
  fileRepository: asClass(FileSystemFileRepository).singleton(),
  commandRunner: asClass(NodeCommandRunner).singleton(),
  commandRunnerService: asClass(RunCommandService).singleton(),
  projectService: asClass(ProjectInitAppService).singleton(),
});

export { container };
