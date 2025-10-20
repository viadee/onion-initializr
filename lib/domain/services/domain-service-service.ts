import { DiFramework } from "../Entities/di-framework";
import { DomainService } from "../Entities/domain-service";
import { Entity } from "../Entities/Entity";
import { FileEntity } from "../Entities/file-entity";
import { DomainServiceConnections } from "../Interfaces/domain-service-connections";
import { TemplateService } from "./template-service";


export interface DomainServiceConnectorParams {
  servicesDir: string;
  domainServiceNames: string[];
  entityNames: string[];
  userConfig?: { domainServiceConnections?: DomainServiceConnections };
  diFramework: DiFramework;
  templateContent: string;
}
export class DomainServiceService {
  /**
   * Generate domain service files from connections using provided template content.
   * @param servicesDir The directory path where domain service files should be created.
   * @param connections The connections between domain services and entities.
   * @param diFramework The dependency injection framework to use.
   * @param templateContent The Handlebars template content for domain service generation.
   * @returns Array of FileEntity objects to be created by the application layer
   */
  generateDomainServicesFiles(
    servicesDir: string,
    connections: DomainServiceConnections,
    diFramework: DiFramework,
    templateContent: string
  ): FileEntity[] {
    const fileEntities: FileEntity[] = [];

    for (const [serviceName, entities] of Object.entries(connections)) {
      const filePath = `${servicesDir}/${serviceName}.ts`;
      const entityObjects: Entity[] = entities.map((name) => new Entity(name));
      const code = this.generateDomainServiceCodeFromTemplate(
        templateContent,
        serviceName,
        diFramework,
        entityObjects
      );
      const file = new FileEntity(filePath, code);
      fileEntities.push(file);
    }

    return fileEntities;
  }

  /**
   * Generate code for a single domain service (no file creation, for preview etc.)
   * Uses provided template content instead of loading from file.
   * @param templateContent The Handlebars template content
   * @param serviceName The domain service name
   */
  generateDomainServiceCodeFromTemplate(
    templateContent: string,
    serviceName: string,
    diFramework: DiFramework,
    entities: Entity[] = []
  ): string {
    const generator = new TemplateService<DomainService>(templateContent);

    const useAngularDI = diFramework === "angular";

    return generator.render({ serviceName, entities, useAngularDI });
  }
  public connectAndGenerateFiles(
    params: DomainServiceConnectorParams
  ): FileEntity[] {
    const {
      servicesDir,
      domainServiceNames,
      entityNames,
      diFramework,
      userConfig = {},
      templateContent,
    } = params;

    const connections =
      userConfig.domainServiceConnections &&
      Object.keys(userConfig.domainServiceConnections).length > 0
        ? userConfig.domainServiceConnections
        : this.createDefaultConnections(domainServiceNames, entityNames);

    return this.generateDomainServicesFiles(
      servicesDir,
      connections,
      diFramework,
      templateContent
    );
  }

  private createDefaultConnections(
    domainServiceNames: string[],
    entityNames: string[]
  ): DomainServiceConnections {
    const connections: DomainServiceConnections = {};
    domainServiceNames.forEach((serviceName) => {
      connections[serviceName] = entityNames;
    });
    return connections;
  }
}
