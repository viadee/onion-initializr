import { OnionConfig } from "../Entities/OnionConfig";
import { OnionRingType, OnionRing } from "../Entities/OnionRing";


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
      return OnionRing.ENTITIES;
    }

    if (data.domainServices?.includes(node)) {
      return OnionRing.DOMAIN_SERVICES;
    }

    if (data.applicationServices?.includes(node)) {
      return OnionRing.APPLICATION_SERVICES;
    }

    const isRepo =
      this.isRepositoryName(node) &&
      this.isValidRepository(node, data.entities || []);
    if (isRepo) {
      return OnionRing.REPOSITORIES;
    }

    return null;
  }
}
