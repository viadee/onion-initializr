import Handlebars from 'handlebars';
import { FileEntity } from '../entities/file-entity';

export class IRepoService {
  /**
   * Generate repository interface files for a list of entity names using provided template content.
   * @param entityFilePaths Array of objects containing entity name and target file path
   * @param templateContent The Handlebars template content for repository interface generation
   * @returns Array of FileEntity objects to be created by the application layer
   */
  generateRepositoryInterfacesFiles(
    entityFilePaths: Array<{ entityName: string; filePath: string }>,
    templateContent: string
  ): FileEntity[] {
    const fileEntities: FileEntity[] = [];

    for (const { entityName, filePath } of entityFilePaths) {
      const code = this.generateRepositoryInterfaceCode(
        templateContent,
        entityName
      );
      const file = new FileEntity(filePath, code);
      fileEntities.push(file);
    }

    return fileEntities;
  }

  /**
   * Generate code for a single repository interface (no file creation, for preview etc.)
   * Uses provided template content instead of loading from file.
   * @param templateContent The Handlebars template content
   * @param entityName The entity name for which to generate repository interface
   * @returns The generated repository interface code
   */
  generateRepositoryInterfaceCode(
    templateContent: string,
    entityName: string
  ): string {
    const template = Handlebars.compile(templateContent);

    return template({ entityName });
  }
}
