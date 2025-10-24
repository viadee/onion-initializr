import { OnionConfig } from "../entities/onion-config";
import { 
  OnionRingType,
  ENTITIES,
  DOMAIN_SERVICES,
  APPLICATION_SERVICES,
  REPOSITORIES
} from "../entities/onion-ring";


export class OnionConfigRepositoryService {
  private extractEntityFromRepository(repoName: string): string | null {
    const match = /^I([A-Z][a-zA-Z0-9]*)Repository$/.exec(repoName);
    return match ? match[1] : null;
  }

  isRepositoryName(name: string): boolean {
    return this.extractEntityFromRepository(name) !== null;
  }

  isValidRepository(repoName: string, entities: string[]): boolean {
    const entityName = this.extractEntityFromRepository(repoName);
    if (!entityName) {
      return false;
    }
    
    return entities?.includes(entityName) || false;
  }

  getRepositories(entities: string[]): string[] {
    return (entities || []).map((entity) => `I${entity}Repository`);
  }

  getRing(node: string, data: OnionConfig): OnionRingType {
    if (data.entities?.includes(node)) {
      return ENTITIES;
    }

    if (data.domainServices?.includes(node)) {
      return DOMAIN_SERVICES;
    }

    if (data.applicationServices?.includes(node)) {
      return APPLICATION_SERVICES;
    }

    const isRepo =
      this.isRepositoryName(node) &&
      this.isValidRepository(node, data.entities || []);
    if (isRepo) {
      return REPOSITORIES;
    }

    return null;
  }
}
