
import { Entity } from "../Entities/Entity";
import { FileEntity } from "../Entities/file-entity";
import { TemplateService } from "./template-service";

export class EntityService {
  /**
   * Generate entity files using provided template content.
   * @param entitiesDir The directory path where entity files should be created.
   * @param entityNames The list of entity names to generate.
   * @param templateContent The Handlebars template content for entity generation.
   * @returns Array of FileEntity objects to be created by the application layer
   */
  generateEntitiesFiles(
    entitiesDir: string,
    entityNames: string[],
    templateContent: string
  ): FileEntity[] {
    const fileEntities: FileEntity[] = [];

    for (const name of entityNames) {
      const filePath = `${entitiesDir}\\${name}.ts`;
      const code = this.generateEntityCodeFromTemplate(templateContent, name);
      const file = new FileEntity(filePath, code);
      fileEntities.push(file);
    }

    return fileEntities;
  }

  /**
   * Generate code for a single entity (no file creation, for preview etc.)
   * Uses provided template content instead of loading from file.
   * @param templateContent The Handlebars template content
   * @param name The entity name
   */
  generateEntityCodeFromTemplate(
    templateContent: string,
    name: string
  ): string {
    const generator = new TemplateService<Entity>(templateContent);
    return generator.render({ name });
  }
}
