import { ApplicationService } from '@onion-initializr/lib/domain/entities/application-service';
import { EntityService } from '@onion-initializr/lib/domain/services/entitity-service';
import { RepoService } from '@onion-initializr/lib/domain/services/repo-service';
import { ApplicationServiceService } from '@onion-initializr/lib/domain/services/application-service-service';
import { ShowcaseService } from '@onion-initializr/lib/domain/services/showcase-service';
import { AwilixConfigService } from '@onion-initializr/lib/domain/services/awilix-config-service';
import {
  DomainServiceConnectorParams,
  DomainServiceService,
} from '@onion-initializr/lib/domain/services/domain-service-service';
import { IRepoService } from '@onion-initializr/lib/domain/services/irepo-service';
import { AppServiceDependencyAppService } from './app-service-dependency-app-service';
import { FileService } from '@onion-initializr/lib/domain/services/file-service';
import { AngularConfigAppService } from '@onion-initializr/lib/application/services/angular-config-app-service';
import { ConfigurationAppService } from '@onion-initializr/lib/application/services/configuration-app-service';
import { FolderStructureService } from '@onion-initializr/lib/application/services/folder-gen-app-service';
import { PathAppService } from '@onion-initializr/lib/application/services/path-app-service';
import {
  DomainServiceConnections,
  ApplicationServiceDependencyMap,
} from '@onion-initializr/lib/domain/interfaces/domain-service-connections';
import { IProjectService } from '@onion-initializr/lib/domain/interfaces/iproject-service';
import { AwilixConfig } from '@onion-initializr/lib/domain/entities/awilix-config';
import { DiFramework } from '@onion-initializr/lib/domain/entities/di-framework';
import { DomainService } from '@onion-initializr/lib/domain/entities/domain-service';
import { FileEntity } from '@onion-initializr/lib/domain/entities/file-entity';
import { ShowcaseAppGeneration } from '@onion-initializr/lib/domain/entities/showcase-app-generation';
import { UIFrameworks } from '@onion-initializr/lib/domain/entities/ui-framework';
import { UiLibrary } from '@onion-initializr/lib/domain/entities/ui-library';
export interface OnionArchitectureGenerationParams {
  folderPath: string;
  entityNames: string[];
  domainServiceNames: string[];
  applicationServiceNames: string[];
  uiFramework: keyof UIFrameworks;
  uiLibrary?: UiLibrary;
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
    const {
      folderPath,
      entityNames,
      domainServiceNames,
      applicationServiceNames,
      uiFramework,
      uiLibrary = 'none',
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
      uiLibrary,
      skipProjectInit
    );

    // Collect all FileEntity objects from domain services
    const allFileEntities: FileEntity[] = [];

    const tsConfigFile =
      await this.configurationAppService.updateVerbatimModuleSyntax(
        folderPath,
        false
      );
    if (tsConfigFile) allFileEntities.push(tsConfigFile);

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
      uiLibrary,
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
    uiLibrary: UiLibrary = 'none',
    skipProjectInit = true
  ): Promise<DiFramework> {
    let diFramework: DiFramework = passedDiFramework || 'awilix';

    if (!skipProjectInit) {
      const stepStart = Date.now();
      const result = await this.projectService.initialize(
        folderPath,
        framework,
        diFramework,
        uiLibrary
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
    const template = await this.fileService.readTemplate('entity.hbs');

    const entitiesDir = this.pathService.join(
      folderPath,
      'src',
      'domain',
      'entities'
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
      'infrastructureRepository.hbs'
    );
    const interfaceTemplate = await this.fileService.readTemplate(
      'repositoryInterface.hbs'
    );

    const infraRepoDir = this.pathService.join(
      folderPath,
      'src',
      'infrastructure',
      'repositories'
    );

    const repoFiles = this.repoService.generateRepositoriesFiles(
      entityNames,
      diFramework,
      repoTemplate.content,
      infraRepoDir
    );

    // Prepare entity file paths for interface generation
    const entityFilePaths = entityNames.map(entityName => ({
      entityName,
      filePath: this.pathService.join(
        folderPath,
        'src',
        'domain',
        'interfaces',
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

    const template = await this.fileService.readTemplate('domainService.hbs');

    const servicesDir = this.pathService.join(
      folderPath,
      'src',
      'domain',
      'services'
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

    const template = await this.fileService.readTemplate('appService.hbs');

    const appDir = this.pathService.join(
      folderPath,
      'src',
      'application',
      'services'
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
    const iRepoList: string[] = entityNames.map(name => `I${name}Repository`);

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
    const fileEntities: FileEntity[] = [];

    if (diFramework === 'awilix') {
      const awilixConfigParams = new AwilixConfig(
        folderPath,
        entityNames,
        domainServiceNames,
        applicationServiceNames
      );
      const awilixConfigPath = this.pathService.join(
        folderPath,
        'src',
        'infrastructure',
        'configuration',
        'awilix.config.ts'
      );
      const awilixFile = this.awilixCfgService.generateAwilixConfigFile(
        awilixConfigParams,
        awilixConfigPath
      );
      fileEntities.push(awilixFile);
    } else if (diFramework === 'angular') {
      const applicationServicesData = Object.entries(appServiceDeps).map(
        ([name, deps]) => ({
          name,
          domainServices: deps.domainServices || [],
          repositories: deps.repositories || [],
        })
      );
      const angularFiles =
        await this.angularConfigAppService.generateAngularProvidersFiles(
          folderPath,
          entityNames,
          domainServiceNames,
          applicationServicesData
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
    uiLibrary: UiLibrary,
    applicationServiceNames: string[]
  ): Promise<FileEntity[]> {
    if (!framework) return [];

    const stepStart = Date.now();
    const showcaseAppGeneration = new ShowcaseAppGeneration(
      folderPath,
      framework,
      diFramework === 'angular',
      uiLibrary,
      applicationServiceNames[0]
    );

    // Compute presentation directory
    const presentationDir = this.pathService.join(
      folderPath,
      'src',
      'infrastructure',
      'presentation'
    );

    // Path builder function for templates and outputs
    const buildPaths = (template: string, output: string) => {
      // Special cases: place certain files in project root instead of presentation directory
      const shouldPlaceInRoot =
        (framework === 'lit' && output === 'index.html') ||
        output === 'README.md';

      const outputPath = shouldPlaceInRoot
        ? this.pathService.join(folderPath, output)
        : this.pathService.join(presentationDir, output);

      return {
        templatePath: this.pathService.join(
          'infrastructure',
          'frameworks',
          'templates',
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
      const dir = file.filePath.substring(0, file.filePath.lastIndexOf('\\'));
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
