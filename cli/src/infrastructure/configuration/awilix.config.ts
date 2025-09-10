import { createContainer, asClass, InjectionMode } from "awilix";

import { OnionConfig } from "../../../../gh-pages/src/Domain/Entities/OnionConfig";
import { AwilixConfig } from "../../../../gh-pages/src/Domain/Entities/AwilixConfig";
import { OnionConfigRepository } from "../../../../gh-pages/src/Infrastructure/Repositories/OnionConfigRepository";
import { OnionConfigService } from "../../../../gh-pages/src/Domain/Services/OnionConfigService";
import { OnionConfigStateService } from "../../../../gh-pages/src/Domain/Services/OnionConfigStateService";
import { OnionConfigNodeService } from "../../../../gh-pages/src/Domain/Services/OnionConfigNodeService";
import { OnionConfigValidationService } from "../../../../gh-pages/src/Domain/Services/OnionConfigValidationService";
import { OnionConfigRepositoryService } from "../../../../gh-pages/src/Domain/Services/OnionConfigRepositoryService";
import { DiagramAppService } from "../../../../gh-pages/src/Application/Services/DiagramAppService";
import { DiagramNodeInteractionAppService } from "../../../../gh-pages/src/Application/Services/DiagramNodeInteractionAppService";
import { DiagramNodeManagementService } from "../../../../gh-pages/src/Application/Services/DiagramNodeManagementAppService";
import { DiagramConnectionAppService } from "../../../../gh-pages/src/Application/Services/DiagramConnectionAppService";
import { DiagramProjectGenerationService } from "../../../../gh-pages/src/Application/Services/DiagramProjectGenerationAppService";
import { HelpAppService } from "../../../../gh-pages/src/Application/Services/HelpAppService";
import { AwilixConfigService } from "../../../../gh-pages/src/Domain/Services/AwilixConfigService";
import { ShowcaseService } from "../../../../gh-pages/src/Domain/Services/ShowcaseService";
import { EntityService } from "../../../../gh-pages/src/Domain/Services/EntitityService";
import { DomainServiceService } from "../../../../gh-pages/src/Domain/Services/DomainServiceService";
import { RepoService } from "../../../../gh-pages/src/Domain/Services/RepoService";
import { ApplicationServiceService } from "../../../../gh-pages/src/Domain/Services/ApplicationServiceService";
import { BrowserCheckAppService } from "../../../../gh-pages/src/Application/Services/BrowserCheckAppService";
import { FileService } from "../../../../gh-pages/src/Domain/Services/FileService";
import { FolderStructureService } from "../../../../gh-pages/src/Application/Services/FolderGenAppService";
import { PathAppService } from "../../../../gh-pages/src/Application/Services/PathAppService";
import { PathRepository } from "../Repositories/PathRepository";
import { IRepoService } from "../../../../gh-pages/src/Domain/Services/IRepoService";
import { FileSystemFileRepository } from "../Repositories/FileSystemFileRepository";
import { NodeCommandRunner } from "../../../../gh-pages/src/Infrastructure/Repositories/NodeCommandRunner";
import { OnionAppService } from "../../../../gh-pages/src/Application/Services/OnionAppService";
import { ProgressTrackingAppService } from "../../../../gh-pages/src/Application/Services/ProgressTrackingAppService";
import { OnionConfigConnectionAppService } from "../../../../gh-pages/src/Application/Services/OnionConfigConnectionAppService";
import { AngularConfigAppService } from "../../../../gh-pages/src/Application/Services/AngularConfigAppService";
import { ConfigurationAppService } from "../../../../gh-pages/src/Application/Services/ConfigurationAppService";
import { RunCommandService } from "../Repositories/RunCommandService";
import { LintAppService } from "../../../../gh-pages/src/Application/Services/LintAppService";
import { DiagramConfigurationAppService } from "../../../../gh-pages/src/Application/Services/DiagramConfigurationAppService";
import { DiagramPositionCalculatorAppService } from "../../../../gh-pages/src/Application/Services/DiagramPositionCalculatorAppService";
import { DiagramSVGRendererAppService } from "../../../../gh-pages/src/Application/Services/DiagramSVGRendererAppService";
import { ScanControllerAppService } from "../../Application/Services/ScanControllerAppService";
import { ScannerAppService } from "../../Application/Services/ScannerAppService";
import { FileHelperAppService } from "../../Application/Services/FileHelperAppService";
import { OnionCliAppService } from "../../Application/Services/OnionCliAppService";
import { AppServiceDependencyAppService } from "../../Application/Services/AppServiceDependencyAppService";
import { ProjectInitAppService } from "../../Application/Services/ProjectInitAppService";

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
  fileRepository: asClass(FileSystemFileRepository).singleton(),
  commandRunner: asClass(NodeCommandRunner).singleton(),
  commandRunnerService: asClass(RunCommandService).singleton(),
  projectService: asClass(ProjectInitAppService).singleton(),
});

export { container };
