import { OnionConfig } from "../entities/onion-config";
import { 
  OnionRingType,
  ENTITIES,
  DOMAIN_SERVICES,
  APPLICATION_SERVICES,
  REPOSITORIES
} from "../entities/onion-ring";


export class OnionConfigRepositoryService {
  isRepositoryName(name: string): boolean {
    // I**Repository
    const repoPattern = /^I([A-Z][a-zA-Z0-9]*)Repository$/;
    return repoPattern.test(name);
  }

  isValidRepository(repoName: string, entities: string[]): boolean {
    if (!this.isRepositoryName(repoName)) {
      return false;
    }

    const match = /^I([A-Z][a-zA-Z0-9]*)Repository$/.exec(repoName);
    if (!match) {
      return false;
    }

    const entityName = match[1];
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
