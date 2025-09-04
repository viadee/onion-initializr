#!/usr/bin/env node
import { OnionConfig } from '../../Domain/Entities/OnionConfig';
import { UIFrameworks } from '../../Domain/Entities/UiFramework';
import { DiFramework } from '../../Domain/Entities/DiFramework';
import { HelpAppService } from './HelpAppService';
import { ScanControllerAppService } from './ScanControllerAppService';
import { OnionConfigService } from '../../Domain/Services/OnionConfigService';
import { FolderStructureService } from './FolderGenAppService';
import { FileHelperAppService } from './FileHelperAppService';
import { PathAppService } from './PathAppService';
import {
  OnionAppService,
  OnionArchitectureGenerationParams,
} from './OnionAppService';
import { IProjectService } from '../../Domain/Interfaces/IProjectService';
import { OnionConfigValidationService } from '../../Domain/Services/OnionConfigValidationService';
import { FileEntity } from '../../Domain/Entities/FileEntity';
import { FileService } from '../../Domain/Services/FileService';

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

    const projectInitResult = await this.projectService.initialize(
      folderPath,
      userConfig.uiFramework
    );
    uiFramework = projectInitResult?.uiFramework || 'react';
    diFramework = projectInitResult?.diFramework || 'awilix';

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
