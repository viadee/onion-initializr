import { FileEntity } from '../../Domain/Entities/file-entity';
import { FileService } from '../../Domain/Services/file-service';
import { TemplateService } from '../../Domain/Services/template-service';
import { PathAppService } from './path-app-service';

export class AngularConfigAppService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}

  async generateAngularProvidersFiles(
    folderPath: string,
    entityNames: string[],
    domainServices: string[] = [],
    applicationServices: { name: string; domainServices: string[]; repositories: string[] }[] = []
  ): Promise<FileEntity[]> {
    const fileEntities: FileEntity[] = [];

    // Generate repository providers
    const repositories = entityNames.map(entityName => `I${entityName}Repository`);
    const repositoryProviders = await this.generateRepositoryProviders(
      folderPath,
      repositories
    );
    fileEntities.push(...repositoryProviders);

    // Generate individual domain service providers
    const domainServiceProviders = await this.generateDomainServiceProviders(
      folderPath,
      domainServices
    );
    fileEntities.push(...domainServiceProviders);

    // Generate individual application service providers
    const appServiceProviders = await this.generateApplicationServiceProviders(
      folderPath,
      applicationServices
    );
    fileEntities.push(...appServiceProviders);

    // Generate main service provider index file
    const serviceProviderIndex = await this.generateServiceProviderIndex(
      folderPath,
      repositories,
      domainServices,
      applicationServices.map(as => as.name)
    );
    fileEntities.push(serviceProviderIndex);

    // Generate modern app.config.ts file
    const appConfigFile = await this.generateAppConfigFile(folderPath, entityNames);
    fileEntities.push(appConfigFile);

    return fileEntities;
  }


  private async generateAppConfigFile(
    folderPath: string,
    entityNames: string[]
  ): Promise<FileEntity> {
    const templatePath = this.pathService.join(
      'infrastructure',
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
      'infrastructure',
      'presentation',
      'app.config.ts'
    );
    const file = new FileEntity(filePath, content);
    return file;
  }

  private async generateDomainServiceProviders(
    folderPath: string,
    domainServices: string[]
  ): Promise<FileEntity[]> {
    const fileEntities: FileEntity[] = [];
    const templatePath = this.pathService.join(
      'infrastructure',
      'frameworks',
      'templates',
      'angular',
      'domainservice.provider.ts.hbs'
    );
    const template = await this.fileService.readTemplate(templatePath);

    const configDir = this.pathService.join(
      folderPath,
      'src',
      'infrastructure',
      'configuration'
    );
    if (!(await this.fileService.dirExists(configDir))) {
      await this.fileService.createDirectory(configDir);
    }
    
    for (const serviceName of domainServices) {
      const generator = new TemplateService<{ serviceName: string }>(template.content);
      const content = generator.render({ serviceName });
      
      const filePath = this.pathService.join(
        configDir,
        `${serviceName}.provider.ts`
      );
      const file = new FileEntity(filePath, content);
      fileEntities.push(file);
    }

    return fileEntities;
  }

  private async generateApplicationServiceProviders(
    folderPath: string,
    applicationServices: { name: string; domainServices: string[]; repositories: string[] }[]
  ): Promise<FileEntity[]> {
    const fileEntities: FileEntity[] = [];
    const templatePath = this.pathService.join(
      'infrastructure',
      'frameworks',
      'templates',
      'angular',
      'appservice.provider.ts.hbs'
    );
    const template = await this.fileService.readTemplate(templatePath);

    const configDir = this.pathService.join(
      folderPath,
      'src',
      'infrastructure',
      'configuration'
    );
    if (!(await this.fileService.dirExists(configDir))) {
      await this.fileService.createDirectory(configDir);
    }

    for (const service of applicationServices) {
      const generator = new TemplateService<{
        name: string;
        domainServices: string[];
        repositories: string[];
      }>(template.content);
      const content = generator.render(service);
      
      const filePath = this.pathService.join(
        configDir,
        `${service.name}.provider.ts`
      );
      const file = new FileEntity(filePath, content);
      fileEntities.push(file);
    }

    return fileEntities;
  }

  private async generateRepositoryProviders(
    folderPath: string,
    repositories: string[]
  ): Promise<FileEntity[]> {
    const fileEntities: FileEntity[] = [];
    const templatePath = this.pathService.join(
      'infrastructure',
      'frameworks',
      'templates',
      'angular',
      'repository.provider.ts.hbs'
    );
    const template = await this.fileService.readTemplate(templatePath);

    const configDir = this.pathService.join(
      folderPath,
      'src',
      'infrastructure',
      'configuration'
    );
    if (!(await this.fileService.dirExists(configDir))) {
      await this.fileService.createDirectory(configDir);
    }

    for (const repository of repositories) {
      const repositoryClass = repository.replace('I', ''); // Remove 'I' prefix
      const entityName = repositoryClass.replace('Repository', '');
      
      const generator = new TemplateService<{ 
        repositoryInterface: string; 
        repositoryClass: string; 
      }>(template.content);
      const content = generator.render({ 
        repositoryInterface: repository,
        repositoryClass: repositoryClass
      });
      
      const filePath = this.pathService.join(
        configDir,
        `${entityName}Repository.provider.ts`
      );
      const file = new FileEntity(filePath, content);
      fileEntities.push(file);
    }

    return fileEntities;
  }

  private async generateServiceProviderIndex(
    folderPath: string,
    repositories: string[],
    domainServices: string[],
    applicationServices: string[]
  ): Promise<FileEntity> {
    const templatePath = this.pathService.join(
      'infrastructure',
      'frameworks',
      'templates',
      'angular',
      'serviceProvider.ts.hbs'
    );
    const template = await this.fileService.readTemplate(templatePath);
    
    // Prepare repository data for template
    const repositoryData = repositories.map(repo => ({
      entityName: repo.replace('I', '').replace('Repository', ''),
      interface: repo,
      class: repo.replace('I', '')
    }));
    
    const generator = new TemplateService<{
      repositoryData: { entityName: string; interface: string; class: string; }[];
      domainServices: string[];
      applicationServices: string[];
    }>(template.content);
    const content = generator.render({ repositoryData, domainServices, applicationServices });

    const configDir = this.pathService.join(
      folderPath,
      'src',
      'infrastructure',
      'configuration'
    );
    if (!(await this.fileService.dirExists(configDir))) {
      await this.fileService.createDirectory(configDir);
    }

    const filePath = this.pathService.join(configDir, 'serviceProvider.ts');
    const file = new FileEntity(filePath, content);
    return file;
  }


}
