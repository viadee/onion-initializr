import { ApplicationService } from "./../../../../lib/Domain/Entities/ApplicationService";
import { EntityService } from "../../../../lib/Domain/Services/EntitityService";
import { RepoService } from "../../../../lib/Domain/Services/RepoService";
import { ApplicationServiceService } from "../../../../lib/Domain/Services/ApplicationServiceService";
import { ShowcaseService } from "../../../../lib/Domain/Services/ShowcaseService";
import { AwilixConfigService } from "../../../../lib/Domain/Services/AwilixConfigService";
import {
  DomainServiceConnectorParams,
  DomainServiceService,
} from "../../../../lib/Domain/Services/DomainServiceService";
import { IRepoService } from "../../../../lib/Domain/Services/IRepoService";
import { AppServiceDependencyAppService } from "./AppServiceDependencyAppService";
import { FileService } from "../../../../lib/Domain/Services/FileService";
import { AngularConfigAppService } from "../../../../lib/Application/Services/AngularConfigAppService";
import { ConfigurationAppService } from "../../../../lib/Application/Services/ConfigurationAppService";
import { FolderStructureService } from "../../../../lib/Application/Services/FolderGenAppService";
import { PathAppService } from "../../../../lib/Application/Services/PathAppService";
import {
  DomainServiceConnections,
  ApplicationServiceDependencyMap,
} from "../../../../lib/Domain/Interfaces/DomainServiceConnections";
import { IProjectService } from "../../../../lib/Domain/Interfaces/IProjectService";
import { AwilixConfig } from "../../../../lib/Domain/Entities/AwilixConfig";
import { DiFramework } from "../../../../lib/Domain/Entities/DiFramework";
import { DomainService } from "../../../../lib/Domain/Entities/DomainService";
import { FileEntity } from "../../../../lib/Domain/Entities/FileEntity";
import { ShowcaseAppGeneration } from "../../../../lib/Domain/Entities/ShowcaseAppGeneration";
import { UIFrameworks } from "../../../../lib/Domain/Entities/UiFramework";
export interface OnionArchitectureGenerationParams {
  folderPath: string;
  entityNames: string[];
  domainServiceNames: string[];
  applicationServiceNames: string[];
  uiFramework: keyof UIFrameworks;
  diFramework?: DiFramework;
  domainServiceConnections?: DomainServiceConnections;
  applicationServiceDependencies?: ApplicationServiceDependencyMap;
  skipProjectInit?: boolean;
}

export class OnionAppService {
  constructor(
    private readonly awilixCfgService: AwilixConfigService,
    private readonly angularConfigAppService: AngularConfigAppService,
    private readonly projectService: IProjectService,
    private readonly showcaseService: ShowcaseService,
    private readonly entityService: EntityService,
    private readonly repoService: RepoService,
    private readonly iRepoService: IRepoService,
    private readonly domainServiceService: DomainServiceService,
    private readonly applicationServiceService: ApplicationServiceService,
    private readonly folderStructureService: FolderStructureService,
    private readonly fileService: FileService,
    private readonly pathService: PathAppService,
    private readonly configurationAppService: ConfigurationAppService,
    private readonly appServiceDependencyAppService: AppServiceDependencyAppService
  ) {}

  async generate(
    params: OnionArchitectureGenerationParams
  ): Promise<FileEntity[]> {
    console.log("🧅 Starting Onion Architecture generation...");

    const {
      folderPath,
      entityNames,
      domainServiceNames,
      applicationServiceNames,
      uiFramework,
      diFramework: passedDiFramework,
      domainServiceConnections,
      applicationServiceDependencies,
      skipProjectInit = true,
    } = params;

    await this.folderStructureService.createFolderStructure(folderPath);

    const diFramework = await this.initializeProject(
      folderPath,
      uiFramework,
      passedDiFramework,
      skipProjectInit
    );

    // Collect all FileEntity objects from domain services
    const allFileEntities: FileEntity[] = [];

    const tsConfigFile =
      await this.configurationAppService.updateVerbatimModuleSyntax(
        folderPath,
        false
      );
    if (tsConfigFile) {
      allFileEntities.push(tsConfigFile);
    }

    // Generate entities, repositories, domain services, application services
    const entityFiles = await this.generateEntities(folderPath, entityNames);
    allFileEntities.push(...entityFiles);

    const repositoryFiles = await this.generateRepositories(
      folderPath,
      entityNames,
      diFramework
    );
    allFileEntities.push(...repositoryFiles);

    const domainServiceFiles = await this.generateDomainServices(
      folderPath,
      domainServiceNames,
      entityNames,
      domainServiceConnections,
      diFramework
    );
    allFileEntities.push(...domainServiceFiles);

    const { appServiceDeps, appServiceFiles } =
      await this.generateApplicationServices(
        folderPath,
        applicationServiceNames,
        domainServiceNames,
        entityNames,
        applicationServiceDependencies,
        diFramework
      );
    allFileEntities.push(...appServiceFiles);

    const diConfigFiles = await this.generateDIConfiguration(
      folderPath,
      entityNames,
      domainServiceNames,
      applicationServiceNames,
      appServiceDeps,
      diFramework
    );
    allFileEntities.push(...diConfigFiles);

    const showcaseFiles = await this.generateShowcaseApplication(
      folderPath,
      uiFramework,
      diFramework,
      applicationServiceNames
    );
    allFileEntities.push(...showcaseFiles);

    // Create all directories first
    await this.createDirectoriesForFiles(allFileEntities);

    // Write all files at once through the repository layer
    await this.writeAllFiles(allFileEntities);

    return allFileEntities;
  }

  private async initializeProject(
    folderPath: string,
    framework: keyof UIFrameworks,
    passedDiFramework?: DiFramework,
    skipProjectInit = true
  ): Promise<DiFramework> {
    let diFramework: DiFramework = passedDiFramework || "awilix";

    if (!skipProjectInit) {
      const stepStart = Date.now();
      const result = await this.projectService.initialize(
        folderPath,
        framework,
        diFramework
      );
      diFramework = result!.diFramework;
      console.log(`✅ Project initialized (${Date.now() - stepStart}ms)`);
    }

    return diFramework;
  }

  private async generateEntities(
    folderPath: string,
    entityNames: string[]
  ): Promise<FileEntity[]> {
    const stepStart = Date.now();

    // Load template content from repository
    const template = await this.fileService.readTemplate("entity.hbs");

    const entitiesDir = this.pathService.join(
      folderPath,
      "src",
      "Domain",
      "Entities"
    );

    const fileEntities = this.entityService.generateEntitiesFiles(
      entitiesDir,
      entityNames,
      template.content
    );
    console.log(`✅ Entities generated (${Date.now() - stepStart}ms)`);
    return fileEntities;
  }

  private async generateRepositories(
    folderPath: string,
    entityNames: string[],
    diFramework: DiFramework
  ): Promise<FileEntity[]> {
    const stepStart = Date.now();

    // Load template content from repository
    const repoTemplate = await this.fileService.readTemplate(
      "infrastructureRepository.hbs"
    );
    const interfaceTemplate = await this.fileService.readTemplate(
      "repositoryInterface.hbs"
    );

    const infraRepoDir = this.pathService.join(
      folderPath,
      "src",
      "Infrastructure",
      "Repositories"
    );

    const repoFiles = this.repoService.generateRepositoriesFiles(
      entityNames,
      diFramework,
      repoTemplate.content,
      infraRepoDir
    );

    // Prepare entity file paths for interface generation
    const entityFilePaths = entityNames.map((entityName) => ({
      entityName,
      filePath: this.pathService.join(
        folderPath,
        "src",
        "Domain",
        "Interfaces",
        `I${entityName}Repository.ts`
      ),
    }));

    const interfaceFiles = this.iRepoService.generateRepositoryInterfacesFiles(
      entityFilePaths,
      interfaceTemplate.content
    );
    console.log(`✅ Repositories generated (${Date.now() - stepStart}ms)`);
    return [...repoFiles, ...interfaceFiles];
  }

  private async generateDomainServices(
    folderPath: string,
    domainServiceNames: string[],
    entityNames: string[],
    domainServiceConnections: DomainServiceConnections | undefined,
    diFramework: DiFramework
  ): Promise<FileEntity[]> {
    const stepStart = Date.now();

    const template = await this.fileService.readTemplate("domainService.hbs");

    const servicesDir = this.pathService.join(
      folderPath,
      "src",
      "Domain",
      "Services"
    );

    const domainServiceParams: DomainServiceConnectorParams = {
      servicesDir,
      domainServiceNames,
      entityNames,
      userConfig: { domainServiceConnections },
      diFramework,
      templateContent: template.content,
    };
    const fileEntities =
      this.domainServiceService.connectAndGenerateFiles(domainServiceParams);
    console.log(`✅ Domain services generated (${Date.now() - stepStart}ms)`);
    return fileEntities;
  }

  private async generateApplicationServices(
    folderPath: string,
    applicationServiceNames: string[],
    domainServiceNames: string[],
    entityNames: string[],
    applicationServiceDependencies: ApplicationServiceDependencyMap | undefined,
    diFramework: DiFramework
  ): Promise<{
    appServiceDeps: ApplicationServiceDependencyMap;
    appServiceFiles: FileEntity[];
  }> {
    const stepStart = Date.now();

    let appServiceDeps = applicationServiceDependencies;
    if (!appServiceDeps || Object.keys(appServiceDeps).length === 0) {
      appServiceDeps = await this.createDefaultApplicationServiceDependencies(
        applicationServiceNames,
        domainServiceNames,
        entityNames
      );
    }

    const template = await this.fileService.readTemplate("appService.hbs");

    const appDir = this.pathService.join(
      folderPath,
      "src",
      "Application",
      "Services"
    );

    const appServiceFiles =
      this.applicationServiceService.generateApplicationServicesFiles(
        appServiceDeps,
        diFramework,
        template.content,
        appDir
      );
    console.log(
      `✅ Application services generated (${Date.now() - stepStart}ms)`
    );

    return {
      appServiceDeps: appServiceDeps,
      appServiceFiles,
    };
  }

  private async createDefaultApplicationServiceDependencies(
    applicationServiceNames: string[],
    domainServiceNames: string[],
    entityNames: string[]
  ): Promise<ApplicationServiceDependencyMap> {
    const applicationServiceObjects = applicationServiceNames.map(
      (name: string) => new ApplicationService(name, [], [])
    );
    const domainServiceObjects = domainServiceNames.map(
      (name: string) => new DomainService(name, [])
    );
    const iRepoList: string[] = entityNames.map((name) => `I${name}Repository`);

    return await this.appServiceDependencyAppService.pickDependencies(
      applicationServiceObjects,
      domainServiceObjects,
      iRepoList
    );
  }

  private async generateDIConfiguration(
    folderPath: string,
    entityNames: string[],
    domainServiceNames: string[],
    applicationServiceNames: string[],
    appServiceDeps: ApplicationServiceDependencyMap,
    diFramework: DiFramework
  ): Promise<FileEntity[]> {
    const stepStart = Date.now();
    let fileEntities: FileEntity[] = [];

    if (diFramework === "awilix") {
      const awilixConfigParams = new AwilixConfig(
        folderPath,
        entityNames,
        domainServiceNames,
        applicationServiceNames
      );
      const awilixConfigPath = this.pathService.join(
        folderPath,
        "src",
        "Infrastructure",
        "Configuration",
        "awilix.config.ts"
      );
      const awilixFile = this.awilixCfgService.generateAwilixConfigFile(
        awilixConfigParams,
        awilixConfigPath
      );
      fileEntities.push(awilixFile);
    } else if (diFramework === "angular") {
      const angularFiles =
        await this.angularConfigAppService.generateAngularProvidersFiles(
          folderPath,
          entityNames
        );
      fileEntities.push(...angularFiles);
    }

    console.log(`✅ DI configuration generated (${Date.now() - stepStart}ms)`);
    return fileEntities;
  }

  private async generateShowcaseApplication(
    folderPath: string,
    framework: keyof UIFrameworks,
    diFramework: DiFramework,
    applicationServiceNames: string[]
  ): Promise<FileEntity[]> {
    if (!framework) return [];

    const stepStart = Date.now();
    const showcaseAppGeneration = new ShowcaseAppGeneration(
      folderPath,
      framework,
      diFramework === "angular",
      applicationServiceNames[0]
    );

    // Compute presentation directory
    const presentationDir = this.pathService.join(
      folderPath,
      "src",
      "Infrastructure",
      "Presentation"
    );

    // Path builder function for templates and outputs
    const buildPaths = (template: string, output: string) => {
      // Special case: for Lit projects, place index.html in project root instead of presentation directory
      const shouldPlaceInRoot = framework === "lit" && output === "index.html";
      const outputPath = shouldPlaceInRoot
        ? this.pathService.join(folderPath, output)
        : this.pathService.join(presentationDir, output);

      return {
        templatePath: this.pathService.join(
          "Infrastructure",
          "frameworks",
          "templates",
          template
        ),
        outputPath,
      };
    };

    const fileEntities = await this.showcaseService.generateShowcaseFiles(
      showcaseAppGeneration,
      buildPaths
    );
    console.log(
      `✅ Showcase application generated (${Date.now() - stepStart}ms)`
    );
    return fileEntities;
  }

  private async createDirectoriesForFiles(
    fileEntities: FileEntity[]
  ): Promise<void> {
    const directories = new Set<string>();

    // Extract unique directories from file paths
    for (const file of fileEntities) {
      const dir = file.filePath.substring(0, file.filePath.lastIndexOf("\\"));
      if (dir) {
        directories.add(dir);
      }
    }

    // Create all directories
    for (const dir of directories) {
      await this.fileService.createDirectory(dir);
    }
  }

  private async writeAllFiles(fileEntities: FileEntity[]): Promise<void> {
    for (const file of fileEntities) {
      await this.fileService.createFile(file);
    }
  }
}
