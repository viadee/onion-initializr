import { DiFramework } from '../entities/di-framework';
import { FileEntity } from '../entities/file-entity';
import { TemplateService } from './template-service';

export class ApplicationServiceService {
  /**
   * Generate application service files from a mapping using provided template content.
   * @param appServiceMappings The mapping of service names to dependencies.
   * @param diFramework The dependency injection framework to use.
   * @param templateContent The Handlebars template content for application service generation.
   * @param appDir The application services directory path (computed by caller).
   * @returns Array of FileEntity objects to be created by the application layer
   */
  generateApplicationServicesFiles(
    appServiceMappings: Record<
      string,
      { domainServices: string[]; repositories: string[] }
    >,
    diFramework: DiFramework,
    templateContent: string,
    appDir: string
  ): FileEntity[] {
    const fileEntities: FileEntity[] = [];

    for (const [appServiceName, deps] of Object.entries(appServiceMappings)) {
      const filePath = `${appDir}/${appServiceName}.ts`;

      const code = this.generateApplicationServiceCodeFromTemplate(
        templateContent,
        appServiceName,
        diFramework,
        deps
      );

      const file = new FileEntity(filePath, code);
      fileEntities.push(file);
    }

    return fileEntities;
  }

  /**
   * Generate code for a single application service (no file creation).
   * Uses provided template content instead of loading from file.
   * @param templateContent The Handlebars template content.
   * @param name The application service name.
   * @param deps The dependencies (domainServices, repositories).
   */
  generateApplicationServiceCodeFromTemplate(
    templateContent: string,
    name: string,
    diFramework: DiFramework,
    deps: { domainServices?: string[]; repositories?: string[] } = {}
  ): string {
    const generator = new TemplateService(templateContent);
    const useAngularDI = diFramework === 'angular';

    return generator.render({ name, ...deps, useAngularDI });
  }
}
