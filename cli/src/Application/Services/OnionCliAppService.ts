#!/usr/bin/env node
import { ScanControllerAppService } from "./ScanControllerAppService";
import { OnionConfigService } from "../../../../lib/Domain/Services/OnionConfigService";
import { FileHelperAppService } from "./FileHelperAppService";
import {
  OnionAppService,
  OnionArchitectureGenerationParams,
} from "./OnionAppService";
import { OnionConfigValidationService } from "../../../../lib/Domain/Services/OnionConfigValidationService";
import { FileService } from "../../../../lib/Domain/Services/FileService";
import { FolderStructureService } from "../../../../lib/Application/Services/FolderGenAppService";
import { PathAppService } from "../../../../lib/Application/Services/PathAppService";
import { IProjectService } from "../../../../lib/Domain/Interfaces/IProjectService";
import { HelpAppService } from "./HelpAppService";
import { DiFramework } from "../../../../lib/Domain/Entities/DiFramework";
import { FileEntity } from "../../../../lib/Domain/Entities/FileEntity";
import { OnionConfig } from "../../../../lib/Domain/Entities/OnionConfig";
import { UIFrameworks } from "../../../../lib/Domain/Entities/UiFramework";

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
    console.log("🧅 Onion CLI - Generate Onion Architecture Structure\n");
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
    uiFramework = projectInitResult?.uiFramework || "react";
    diFramework = projectInitResult?.diFramework || "awilix";

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
