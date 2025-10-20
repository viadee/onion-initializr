import { createContainer, asClass, InjectionMode } from "awilix";

import { OnionConfigRepository } from "../../../../gh-pages/src/Infrastructure/Repositories/onion-config-repository";
import { OnionConfigService } from "../../../../lib/Domain/Services/onion-config-service";
import { OnionConfigStateService } from "../../../../lib/Domain/Services/onion-config-state-service";
import { OnionConfigNodeService } from "../../../../lib/Domain/Services/onion-config-node-service";
import { OnionConfigValidationService } from "../../../../lib/Domain/Services/onion-config-validation-service";
import { OnionConfigRepositoryService } from "../../../../lib/Domain/Services/onion-config-repository-service";
import { AwilixConfigService } from "../../../../lib/Domain/Services/awilix-config-service";
import { ShowcaseService } from "../../../../lib/Domain/Services/showcase-service";
import { EntityService } from "../../../../lib/Domain/Services/entitity-service";
import { DomainServiceService } from "../../../../lib/Domain/Services/domain-service-service";
import { RepoService } from "../../../../lib/Domain/Services/repo-service";
import { ApplicationServiceService } from "../../../../lib/Domain/Services/application-service-service";
import { FileService } from "../../../../lib/Domain/Services/file-service";
import { PathRepository } from "../Repositories/path-repository";
import { IRepoService } from "../../../../lib/Domain/Services/irepo-service";
import { FileSystemFileRepository } from "../Repositories/file-system-file-repository";
import { ScanControllerAppService } from "../../Application/Services/scan-controller-app-service";
import { ScannerAppService } from "../../Application/Services/scanner-app-service";
import { FileHelperAppService } from "../../Application/Services/file-helper-app-service";
import { OnionCliAppService } from "../../Application/Services/onion-cli-app-service";
import { AppServiceDependencyAppService } from "../../Application/Services/app-service-dependency-app-service";
import { ProjectInitAppService } from "../../Application/Services/project-init-app-service";
import { DiagramAppService } from "../../../../gh-pages/src/Application/Services/diagram-app-service";
import { DiagramConfigurationAppService } from "../../../../gh-pages/src/Application/Services/diagram-configuration-app-service";
import { DiagramConnectionAppService } from "../../../../gh-pages/src/Application/Services/diagram-connection-app-service";
import { DiagramNodeInteractionAppService } from "../../../../gh-pages/src/Application/Services/diagram-node-interaction-app-service";
import { DiagramNodeManagementService } from "../../../../gh-pages/src/Application/Services/diagram-node-management-app-service";
import { DiagramPositionCalculatorAppService } from "../../../../gh-pages/src/Application/Services/diagram-position-calculator-app-service";
import { DiagramProjectGenerationService } from "../../../../gh-pages/src/Application/Services/diagram-project-generation-app-service";
import { DiagramSVGRendererAppService } from "../../../../gh-pages/src/Application/Services/diagram-svgrenderer-app-service";
import { HelpAppService } from "../../Application/Services/help-app-service";
import { ProgressTrackingAppService } from "../../../../gh-pages/src/Application/Services/progress-tracking-app-service";
import { AngularConfigAppService } from "../../../../lib/Application/Services/angular-config-app-service";
import { BrowserCheckAppService } from "../../../../lib/Application/Services/browser-check-app-service";
import { ConfigurationAppService } from "../../../../lib/Application/Services/configuration-app-service";
import { FolderStructureService } from "../../../../lib/Application/Services/folder-gen-app-service";
import { PathAppService } from "../../../../lib/Application/Services/path-app-service";
import { OnionAppService } from "../../Application/Services/onion-app-service";
import { OnionConfigConnectionAppService } from "../../../../lib/Application/Services/onion-config-connection-app-service";
import { OnionConfig } from "../../../../lib/Domain/Entities/onion-config";
import { AwilixConfig } from "../../../../lib/Domain/Entities/awilix-config";
import { LintAppService } from "../../../../lib/Application/Services/lint-app-service";
import { RunCommandService } from "../repositories/run-command-service";
import { NodeCommandRunner } from "../repositories/node-command-runner";
import { UILibrarySetupService } from "../../../../lib/Application/Services/uilibrary-setup-service";

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
