import { FileEntity } from '../../Domain/Entities/FileEntity';
import { FileService } from '../../Domain/Services/FileService';
import { TemplateService } from '../../Domain/Services/TemplateService';
import { PathAppService } from './PathAppService';

export interface AngularDIProvider {
  provide: string;
  useClass: string;
  deps?: string[];
}

export class AngularConfigAppService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}

  async generateAngularProvidersFiles(
    folderPath: string,
    entityNames: string[],
    domainServiceNames: string[],
    applicationServiceNames: string[],
    applicationServiceDependencies: Record<
      string,
      { domainServices: string[]; repositories: string[] }
    >
  ): Promise<FileEntity[]> {
    const providers = this.buildProviderConfig(
      entityNames,
      domainServiceNames,
      applicationServiceNames,
      applicationServiceDependencies
    );

    const fileEntities: FileEntity[] = [];

    const providersFile = await this.generateProvidersFile(
      folderPath,
      providers
    );
    fileEntities.push(providersFile);

    const appConfigFile = await this.generateAppConfigFile(folderPath);
    fileEntities.push(appConfigFile);

    return fileEntities;
  }

  private buildProviderConfig(
    entityNames: string[],
    domainServiceNames: string[],
    applicationServiceNames: string[],
    applicationServiceDependencies: Record<
      string,
      { domainServices: string[]; repositories: string[] }
    >
  ): AngularDIProvider[] {
    const providers: AngularDIProvider[] = [];

    // Add repository providers
    entityNames.forEach(entityName => {
      const repoName = `${entityName}Repository`;
      const interfaceName = `I${entityName}Repository`;
      providers.push({
        provide: interfaceName,
        useClass: repoName,
      });
    });

    // Add domain service providers
    domainServiceNames.forEach(serviceName => {
      providers.push({
        provide: serviceName,
        useClass: serviceName,
      });
    });

    // Add application service providers with dependencies
    applicationServiceNames.forEach(appServiceName => {
      const deps = applicationServiceDependencies[appServiceName];
      if (deps) {
        const dependencies = [
          ...(deps.domainServices || []),
          ...(deps.repositories || []),
        ];
        providers.push({
          provide: appServiceName,
          useClass: appServiceName,
          deps: dependencies.length > 0 ? dependencies : undefined,
        });
      } else {
        providers.push({
          provide: appServiceName,
          useClass: appServiceName,
        });
      }
    });

    return providers;
  }

  private async generateProvidersFile(
    folderPath: string,
    providers: AngularDIProvider[]
  ): Promise<FileEntity> {
    const imports = this.generateImports(providers);

    const templatePath = this.pathService.join(
      'Infrastructure',
      'frameworks',
      'templates',
      'angular',
      'di-providers.ts.hbs'
    );

    const template = await this.fileService.readTemplate(templatePath);
    const generator = new TemplateService<{
      imports: string[];
      providers: AngularDIProvider[];
    }>(template.content);

    const content = generator.render({
      imports: imports,
      providers: providers,
    });

    const appDir = this.pathService.join(folderPath, 'src', 'app');
    if (!(await this.fileService.dirExists(appDir))) {
      await this.fileService.createDirectory(appDir);
    }

    const filePath = this.pathService.join(
      folderPath,
      'src',
      'Infrastructure',
      'Presentation',
      'di-providers.ts'
    );
    const file = new FileEntity(filePath, content);
    return file;
  }

  private async generateAppConfigFile(folderPath: string): Promise<FileEntity> {
    const templatePath = this.pathService.join(
      'Infrastructure',
      'frameworks',
      'templates',
      'angular',
      'app.config.ts.hbs'
    );
    const template = await this.fileService.readTemplate(templatePath);
    const generator = new TemplateService<{}>(template.content);

    const content = generator.render({});

    const appDir = this.pathService.join(folderPath);
    if (!(await this.fileService.dirExists(appDir))) {
      await this.fileService.createDirectory(appDir);
    }

    const filePath = this.pathService.join(
      folderPath,
      'src',
      'Infrastructure',
      'Presentation',
      'app.config.ts'
    );
    const file = new FileEntity(filePath, content);
    return file;
  }

  private generateImports(providers: AngularDIProvider[]): string[] {
    const imports = new Set<string>();

    providers.forEach(provider => {
      const importStatements = this.createImportStatements(provider.useClass);
      importStatements.forEach(statement => imports.add(statement));
    });

    return Array.from(imports);
  }

  private createImportStatements(className: string): string[] {
    if (this.isRepository(className)) {
      return this.createRepositoryImports(className);
    }

    if (this.isDomainService(className)) {
      return this.createDomainServiceImports(className);
    }

    if (this.isAppService(className)) {
      return this.createAppServiceImports(className);
    }

    return [];
  }

  private isRepository(className: string): boolean {
    return className.endsWith('Repository');
  }

  private isDomainService(className: string): boolean {
    return className.endsWith('Service') && !className.endsWith('AppService');
  }

  private isAppService(className: string): boolean {
    return className.endsWith('AppService');
  }

  private createRepositoryImports(className: string): string[] {
    const entityName = className.replace('Repository', '');
    return [
      `import { ${className} } from '../../Infrastructure/Repositories/${className}';`,
      `import { I${entityName}Repository } from '../../Domain/Interfaces/I${entityName}Repository';`,
    ];
  }

  private createDomainServiceImports(className: string): string[] {
    return [
      `import { ${className} } from '../../Domain/Services/${className}';`,
    ];
  }

  private createAppServiceImports(className: string): string[] {
    return [
      `import { ${className} } from '../../Application/Services/${className}';`,
    ];
  }
}
