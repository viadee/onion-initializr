#!/usr/bin/env node
import { ScanControllerAppService } from './scan-controller-app-service';
import { OnionConfigService } from '../../../../lib/domain/services/onion-config-service';
import { FileHelperAppService } from './file-helper-app-service';
import {
  OnionAppService,
  OnionArchitectureGenerationParams,
} from './onion-app-service';
import { OnionConfigValidationService } from '../../../../lib/domain/services/onion-config-validation-service';
import { FileService } from '../../../../lib/domain/services/file-service';
import { FolderStructureService } from '../../../../lib/application/services/folder-gen-app-service';
import { PathAppService } from '../../../../lib/application/services/path-app-service';
import { IProjectService } from '../../../../lib/domain/interfaces/iproject-service';
import { HelpAppService } from './help-app-service';
import { DiFramework } from '../../../../lib/domain/entities/di-framework';
import { FileEntity } from '../../../../lib/domain/entities/file-entity';
import { OnionConfig } from '../../../../lib/domain/entities/onion-config';
import { UIFrameworks } from '../../../../lib/domain/entities/ui-framework';

export class OnionCliAppService {
  constructor(
    private readonly helpAppService: HelpAppService,
    private readonly scanControllerService: ScanControllerAppService,
    private readonly onionConfigService: OnionConfigService,
    private readonly projectService: IProjectService,
    private readonly folderStructureService: FolderStructureService,
    private readonly fileHelperService: FileHelperAppService,
    private readonly pathService: PathAppService,
    private readonly onionAppService: OnionAppService,
    private readonly fileService: FileService,
    private readonly validationService: OnionConfigValidationService
  ) {}

  /**
   * The main function that runs the from the CLI or uses a config file.
   * It handles all things specifically necessary for the CLI mode
   * Both this function and the WebApp call `generateOnionArchitecture`
   * to perform the actual generation of the Onion Architecture files,
   *  ShowcaseApp, Dependency Injection Config.
   */
  public async runOnionCli() {
    this.helpAppService.handleHelp();
    await this.scanControllerService.handleScan();
    console.log('🧅 Onion CLI - Generate Onion Architecture Structure\n');
    // helper immer schlechter name
    const configurationFilePath = this.fileHelperService.getConfigFilePath();

    let userConfig: OnionConfig = OnionConfig.empty();

    if (configurationFilePath) {
      const resolvedConfigPath = this.pathService.isAbsolute(
        configurationFilePath
      )
        ? configurationFilePath
        : this.pathService.resolve(process.cwd(), configurationFilePath);

      const configurationFile =
        await this.fileService.readFile(resolvedConfigPath);
      if (
        !(await this.validationService.isUserConfigValid(configurationFile))
      ) {
        process.exit(1);
      }
      userConfig = this.onionConfigService.mapFileToConfig(configurationFile);
    }

    const rawFolderPath = await this.fileHelperService.getFolderPath(
      userConfig,
      process.cwd()
    );
    const folderPath = this.pathService.isAbsolute(rawFolderPath)
      ? rawFolderPath
      : this.pathService.resolve(process.cwd(), rawFolderPath);

    await this.folderStructureService.createFolderStructure(folderPath);

    let uiFramework: keyof UIFrameworks | undefined;
    let diFramework: DiFramework;
    let uiLibrary = userConfig.uiLibrary || 'none';

    const projectInitResult = await this.projectService.initialize(
      folderPath,
      userConfig.uiFramework
    );
    uiFramework = projectInitResult?.uiFramework || 'react';
    diFramework = projectInitResult?.diFramework || 'awilix';
    if (projectInitResult?.uiLibrary) {
      uiLibrary = projectInitResult.uiLibrary;
    }

    const entityNames = await this.fileHelperService.getEntityNames(userConfig);
    const domainServiceNames =
      await this.fileHelperService.getDomainServiceNames(userConfig);
    const applicationServiceNames =
      await this.fileHelperService.getApplicationServiceNames(userConfig);

    await this.onionAppService.generate({
      folderPath,
      entityNames,
      domainServiceNames,
      applicationServiceNames,
      uiFramework,
      uiLibrary: uiLibrary,
      diFramework,
      domainServiceConnections: userConfig.domainServiceConnections,
      applicationServiceDependencies: userConfig.applicationServiceDependencies,
      skipProjectInit: true,
    });
  }

  async generateOnionArchitecture(
    params: OnionArchitectureGenerationParams
  ): Promise<FileEntity[]> {
    return this.onionAppService.generate(params);
  }
}
