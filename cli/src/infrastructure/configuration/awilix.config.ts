import { createContainer, asClass, InjectionMode } from "awilix";

import { OnionConfigRepository } from "../../../../gh-pages/src/Infrastructure/Repositories/OnionConfigRepository";
import { OnionConfigService } from "../../../../lib/Domain/Services/OnionConfigService";
import { OnionConfigStateService } from "../../../../lib/Domain/Services/OnionConfigStateService";
import { OnionConfigNodeService } from "../../../../lib/Domain/Services/OnionConfigNodeService";
import { OnionConfigValidationService } from "../../../../lib/Domain/Services/OnionConfigValidationService";
import { OnionConfigRepositoryService } from "../../../../lib/Domain/Services/OnionConfigRepositoryService";
import { AwilixConfigService } from "../../../../lib/Domain/Services/AwilixConfigService";
import { ShowcaseService } from "../../../../lib/Domain/Services/ShowcaseService";
import { EntityService } from "../../../../lib/Domain/Services/EntitityService";
import { DomainServiceService } from "../../../../lib/Domain/Services/DomainServiceService";
import { RepoService } from "../../../../lib/Domain/Services/RepoService";
import { ApplicationServiceService } from "../../../../lib/Domain/Services/ApplicationServiceService";
import { FileService } from "../../../../lib/Domain/Services/FileService";
import { PathRepository } from "../Repositories/PathRepository";
import { IRepoService } from "../../../../lib/Domain/Services/IRepoService";
import { FileSystemFileRepository } from "../Repositories/FileSystemFileRepository";
import { NodeCommandRunner } from "../../../../gh-pages/src/Infrastructure/Repositories/NodeCommandRunner";
import { RunCommandService } from "../Repositories/RunCommandService";
import { ScanControllerAppService } from "../../Application/Services/ScanControllerAppService";
import { ScannerAppService } from "../../Application/Services/ScannerAppService";
import { FileHelperAppService } from "../../Application/Services/FileHelperAppService";
import { OnionCliAppService } from "../../Application/Services/OnionCliAppService";
import { AppServiceDependencyAppService } from "../../Application/Services/AppServiceDependencyAppService";
import { ProjectInitAppService } from "../../Application/Services/ProjectInitAppService";
import { DiagramAppService } from "../../../../gh-pages/src/Application/Services/DiagramAppService";
import { DiagramConfigurationAppService } from "../../../../gh-pages/src/Application/Services/DiagramConfigurationAppService";
import { DiagramConnectionAppService } from "../../../../gh-pages/src/Application/Services/DiagramConnectionAppService";
import { DiagramNodeInteractionAppService } from "../../../../gh-pages/src/Application/Services/DiagramNodeInteractionAppService";
import { DiagramNodeManagementService } from "../../../../gh-pages/src/Application/Services/DiagramNodeManagementAppService";
import { DiagramPositionCalculatorAppService } from "../../../../gh-pages/src/Application/Services/DiagramPositionCalculatorAppService";
import { DiagramProjectGenerationService } from "../../../../gh-pages/src/Application/Services/DiagramProjectGenerationAppService";
import { DiagramSVGRendererAppService } from "../../../../gh-pages/src/Application/Services/DiagramSVGRendererAppService";
import { HelpAppService } from "../../../../gh-pages/src/Application/Services/HelpAppService";
import { ProgressTrackingAppService } from "../../../../gh-pages/src/Application/Services/ProgressTrackingAppService";
import { AngularConfigAppService } from "../../../../lib/Application/Services/AngularConfigAppService";
import { BrowserCheckAppService } from "../../../../lib/Application/Services/BrowserCheckAppService";
import { ConfigurationAppService } from "../../../../lib/Application/Services/ConfigurationAppService";
import { FolderStructureService } from "../../../../lib/Application/Services/FolderGenAppService";
import { PathAppService } from "../../../../lib/Application/Services/PathAppService";
import { OnionAppService } from "../../Application/Services/OnionAppService";
import { OnionConfigConnectionAppService } from "../../../../lib/Application/Services/OnionConfigConnectionAppService";
import { OnionConfig } from "../../../../lib/Domain/Entities/OnionConfig";
import { AwilixConfig } from "../../../../lib/Domain/Entities/AwilixConfig";
import { LintAppService } from "../../../../lib/Application/Services/LintAppService";

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
