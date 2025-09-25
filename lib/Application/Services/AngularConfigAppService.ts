import { FileEntity } from '../../Domain/Entities/FileEntity';
import { FileService } from '../../Domain/Services/FileService';
import { TemplateService } from '../../Domain/Services/TemplateService';
import { PathAppService } from './PathAppService';

export class AngularConfigAppService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}

  async generateAngularProvidersFiles(
    folderPath: string,
    entityNames: string[]
  ): Promise<FileEntity[]> {
    const fileEntities: FileEntity[] = [];

    // Generate injection tokens file for interfaces
    const injectionTokensFile = await this.generateInjectionTokensFile(
      folderPath,
      entityNames
    );
    fileEntities.push(injectionTokensFile);

    // Generate modern app.config.ts file
    const appConfigFile = await this.generateAppConfigFile(
      folderPath,
      entityNames
    );
    fileEntities.push(appConfigFile);

    return fileEntities;
  }



  private async generateInjectionTokensFile(
    folderPath: string,
    entityNames: string[]
  ): Promise<FileEntity> {
    const templatePath = this.pathService.join(
      'Infrastructure',
      'frameworks',
      'templates',
      'angular',
      'injection-tokens.ts.hbs'
    );
    const template = await this.fileService.readTemplate(templatePath);
    
    // Create repository interface names
    const repositories = entityNames.map(entityName => `I${entityName}Repository`);
    
    const generator = new TemplateService<{ repositories: string[] }>(template.content);
    const content = generator.render({ repositories });

    const appDir = this.pathService.join(folderPath, 'src', 'Infrastructure', 'Presentation');
    if (!(await this.fileService.dirExists(appDir))) {
      await this.fileService.createDirectory(appDir);
    }

    const filePath = this.pathService.join(
      folderPath,
      'src',
      'Infrastructure',
      'Presentation',
      'injection-tokens.ts'
    );
    const file = new FileEntity(filePath, content);
    return file;
  }

  private async generateAppConfigFile(
    folderPath: string,
    entityNames: string[]
  ): Promise<FileEntity> {
    const templatePath = this.pathService.join(
      'Infrastructure',
      'frameworks',
      'templates',
      'angular',
      'app.config.ts.hbs'
    );
    const template = await this.fileService.readTemplate(templatePath);
    
    // Create repository interface names
    const repositories = entityNames.map(entityName => `I${entityName}Repository`);
    
    const generator = new TemplateService<{ repositories: string[] }>(template.content);
    const content = generator.render({ repositories });

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


}
