import { createContainer, asClass, InjectionMode } from 'awilix';

import { OnionConfigService } from '@onion-initializr/lib/domain/services/onion-config-service';
import { OnionConfigStateService } from '@onion-initializr/lib/domain/services/onion-config-state-service';
import { OnionConfigNodeService } from '@onion-initializr/lib/domain/services/onion-config-node-service';
import { OnionConfigValidationService } from '@onion-initializr/lib/domain/services/onion-config-validation-service';
import { OnionConfigRepositoryService } from '@onion-initializr/lib/domain/services/onion-config-repository-service';
import { AwilixConfigService } from '@onion-initializr/lib/domain/services/awilix-config-service';
import { ShowcaseService } from '@onion-initializr/lib/domain/services/showcase-service';
import { EntityService } from '@onion-initializr/lib/domain/services/entitity-service';
import { DomainServiceService } from '@onion-initializr/lib/domain/services/domain-service-service';
import { RepoService } from '@onion-initializr/lib/domain/services/repo-service';
import { ApplicationServiceService } from '@onion-initializr/lib/domain/services/application-service-service';
import { FileService } from '@onion-initializr/lib/domain/services/file-service';
import { PathRepository } from '../repositories/path-repository';
import { IRepoService } from '@onion-initializr/lib/domain/services/irepo-service';
import { FileSystemFileRepository } from '../repositories/file-system-file-repository';
import { ScanControllerAppService } from '../../application/services/scan-controller-app-service';
import { ScannerAppService } from '../../application/services/scanner-app-service';
import { FileHelperAppService } from '../../application/services/file-helper-app-service';
import { OnionCliAppService } from '../../application/services/onion-cli-app-service';
import { AppServiceDependencyAppService } from '../../application/services/app-service-dependency-app-service';
import { ProjectInitAppService } from '../../application/services/project-init-app-service';
import { HelpAppService } from '../../application/services/help-app-service';
import { AngularConfigAppService } from '@onion-initializr/lib/application/services/angular-config-app-service';
import { BrowserCheckAppService } from '@onion-initializr/lib/application/services/browser-check-app-service';
import { ConfigurationAppService } from '@onion-initializr/lib/application/services/configuration-app-service';
import { FolderStructureService } from '@onion-initializr/lib/application/services/folder-gen-app-service';
import { PathAppService } from '@onion-initializr/lib/application/services/path-app-service';
import { OnionAppService } from '../../application/services/onion-app-service';
import { OnionConfigConnectionAppService } from '@onion-initializr/lib/application/services/onion-config-connection-app-service';
import { OnionConfig } from '@onion-initializr/lib/domain/entities/onion-config';
import { AwilixConfig } from '@onion-initializr/lib/domain/entities/awilix-config';
import { LintAppService } from '@onion-initializr/lib/application/services/lint-app-service';
import { RunCommandService } from '../repositories/run-command-service';
import { NodeCommandRunner } from '../repositories/node-command-runner';
import { UILibrarySetupService } from '@onion-initializr/lib/application/services/uilibrary-setup-service';

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
  onionConfigRepository: asClass(OnionConfigRepositoryService).singleton(),
  onionConfigService: asClass(OnionConfigService).singleton(),

  applicationServiceService: asClass(ApplicationServiceService).singleton(),
  pathService: asClass(PathAppService).singleton(),
  pathRepository: asClass(PathRepository).singleton(),
  browserCheckAppService: asClass(BrowserCheckAppService).singleton(),
  onionCliAppService: asClass(OnionCliAppService).singleton(),
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
