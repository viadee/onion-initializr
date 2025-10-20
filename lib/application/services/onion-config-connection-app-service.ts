import { OnionConfig } from '../../domain/entities/onion-config';
import { OnionConfigStateService } from '../../domain/services/onion-config-state-service';
import { OnionConfigRepositoryService } from '../../domain/services/onion-config-repository-service';
import { IConnectionValidator } from '../../domain/interfaces/iconnection-validator';
import { OnionRing } from '../../domain/entities/onion-ring';
export class OnionConfigConnectionAppService implements IConnectionValidator {
  constructor(
    private readonly stateService: OnionConfigStateService,
    private readonly repositoryService: OnionConfigRepositoryService
  ) {}

  addConnection(
    source: string,
    target: string
  ): {
    success: boolean;
    message: string;
    data: OnionConfig | null;
  } {
    const data = this.stateService.getData();
    if (!data) {
      return { success: false, message: 'No data loaded', data: null };
    }

    const { entities, domainServices, applicationServices } = data;

    const sourceIsEntity = entities.includes(source);
    const sourceIsDomain = domainServices.includes(source);
    const sourceIsApp = applicationServices.includes(source);
    const sourceIsRepo =
      this.repositoryService.isRepositoryName(source) &&
      this.repositoryService.isValidRepository(source, entities);

    const targetIsEntity = entities.includes(target);
    const targetIsDomain = domainServices.includes(target);
    const targetIsApp = applicationServices.includes(target);
    const targetIsRepo =
      this.repositoryService.isRepositoryName(target) &&
      this.repositoryService.isValidRepository(target, entities);

    const isValid =
      (sourceIsApp && targetIsDomain) ||
      (sourceIsApp && targetIsRepo) ||
      (sourceIsRepo && targetIsApp) ||
      (sourceIsDomain && targetIsApp) ||
      (sourceIsDomain && targetIsEntity) ||
      (sourceIsEntity && targetIsDomain);

    if (!isValid) {
      return {
        success: false,
        message: `Connections must be of ONE-RING Distance`,
        data: null,
      };
    }

    if (sourceIsEntity && targetIsDomain) {
      return this.toggleRecordConnection(
        data.domainServiceConnections,
        target,
        source
      );
    }

    if (sourceIsDomain && targetIsEntity) {
      return this.toggleRecordConnection(
        data.domainServiceConnections,
        source,
        target
      );
    }

    if (sourceIsApp && targetIsDomain) {
      return this.toggleAppDependency(source, target, 'domainServices');
    }

    if (sourceIsApp && targetIsRepo) {
      return this.toggleAppDependency(source, target, 'repositories');
    }

    if (sourceIsRepo && targetIsApp) {
      const currentData = this.stateService.getData();
      if (!currentData.applicationServiceDependencies[target]) {
        currentData.applicationServiceDependencies[target] = {
          domainServices: [],
          repositories: [],
        };
      }

      const repos =
        currentData.applicationServiceDependencies[target].repositories;

      if (!repos.includes(source)) {
        repos.push(source);
        return {
          success: true,
          message: `Connection from "${source}" to "${target}" added`,
          data: currentData,
        };
      } else {
        repos.splice(repos.indexOf(source), 1);
        return {
          success: true,
          message: `Connection from "${source}" to "${target}" removed`,
          data: currentData,
        };
      }
    }

    if (sourceIsDomain && targetIsApp) {
      return this.toggleAppDependency(target, source, 'domainServices');
    }

    return {
      success: false,
      message: 'Unexpected error handling connection',
      data: null,
    };
  }

  removeConnection(
    source: string,
    target: string
  ): { success: boolean; message: string; data?: OnionConfig } {
    const data = this.stateService.getData();
    const newData: OnionConfig = { ...data };
    const sourceRing = this.repositoryService.getRing(source, data);
    const sourceIsRepo =
      this.repositoryService.isRepositoryName(source) &&
      this.repositoryService.isValidRepository(source, data.entities || []);
    let connectionRemoved = false;

    if (
      sourceRing === OnionRing.DOMAIN_SERVICES &&
      newData.domainServiceConnections?.[source]
    ) {
      const connections = newData.domainServiceConnections[source];
      const index = connections.indexOf(target);
      if (index > -1) {
        connections.splice(index, 1);
        connectionRemoved = true;
      }
    } else if (
      sourceRing === OnionRing.APPLICATION_SERVICES &&
      newData.applicationServiceDependencies?.[source]
    ) {
      const domainDeps =
        newData.applicationServiceDependencies[source].domainServices;
      const domainIndex = domainDeps.indexOf(target);

      if (domainIndex > -1) {
        domainDeps.splice(domainIndex, 1);
        connectionRemoved = true;
      } else {
        const repoDeps =
          newData.applicationServiceDependencies[source].repositories;
        const repoIndex = repoDeps.indexOf(target);

        if (repoIndex > -1) {
          repoDeps.splice(repoIndex, 1);
          connectionRemoved = true;
        }
      }
    } else if (
      sourceIsRepo &&
      this.repositoryService.getRing(target, data) ===
        OnionRing.APPLICATION_SERVICES
    ) {
      const repoDeps =
        newData.applicationServiceDependencies?.[target]?.repositories;

      if (repoDeps) {
        const repoIndex = repoDeps.indexOf(source);
        if (repoIndex > -1) {
          repoDeps.splice(repoIndex, 1);
          connectionRemoved = true;
        }
      }
    }

    if (!connectionRemoved) {
      return {
        success: false,
        message: 'Connection not found',
      };
    }

    this.stateService.setData(newData);
    return {
      success: true,
      message: 'Connection removed successfully',
      data: newData,
    };
  }

  hasConnection(source: string, target: string): boolean {
    const data = this.stateService.getData();
    const sourceRing = this.repositoryService.getRing(source, data);
    const sourceIsRepo =
      this.repositoryService.isRepositoryName(source) &&
      this.repositoryService.isValidRepository(source, data.entities || []);

    if (sourceRing === OnionRing.DOMAIN_SERVICES) {
      return data.domainServiceConnections?.[source]?.includes(target) || false;
    } else if (sourceRing === OnionRing.APPLICATION_SERVICES) {
      const hasDomainConnection =
        data.applicationServiceDependencies?.[source]?.domainServices?.includes(
          target
        ) || false;
      const hasRepoConnection =
        data.applicationServiceDependencies?.[source]?.repositories?.includes(
          target
        ) || false;
      return hasDomainConnection || hasRepoConnection;
    } else if (
      sourceIsRepo &&
      this.repositoryService.getRing(target, data) ===
        OnionRing.APPLICATION_SERVICES
    ) {
      const deps = data.applicationServiceDependencies?.[target];
      return deps?.repositories?.includes(source) || false;
    }

    return false;
  }

  getPossibleTargets(sourceNode: string): string[] {
    const data = this.stateService.getData();
    if (!data) return [];

    const { entities, domainServices, applicationServices } = data;
    const sourceIsRepo =
      this.repositoryService.isRepositoryName(sourceNode) &&
      this.repositoryService.isValidRepository(sourceNode, entities || []);

    if (entities?.includes(sourceNode)) {
      return domainServices ?? [];
    }

    if (domainServices?.includes(sourceNode)) {
      return [...(entities ?? []), ...(applicationServices ?? [])];
    }

    if (applicationServices?.includes(sourceNode)) {
      const repositories = this.repositoryService.getRepositories(
        entities || []
      );
      return [...(domainServices ?? []), ...repositories];
    }

    if (sourceIsRepo) {
      return applicationServices ?? [];
    }

    return [];
  }

  getCurrentTargets(source: string): string[] {
    const data = this.stateService.getData();
    const sourceRing = this.repositoryService.getRing(source, data);
    const sourceIsRepo =
      this.repositoryService.isRepositoryName(source) &&
      this.repositoryService.isValidRepository(source, data.entities || []);

    if (sourceRing === OnionRing.DOMAIN_SERVICES) {
      return data.domainServiceConnections?.[source] || [];
    } else if (sourceRing === OnionRing.APPLICATION_SERVICES) {
      const deps = data.applicationServiceDependencies?.[source];
      if (!deps) {
        return [];
      }
      return [...(deps.domainServices || []), ...(deps.repositories || [])];
    } else if (sourceIsRepo) {
      const appServices = data.applicationServices || [];
      return appServices.filter((appService: string | number) => {
        const deps = data.applicationServiceDependencies?.[appService];
        return deps?.repositories?.includes(source) || false;
      });
    }

    return [];
  }

  validateConnection(source: string, target: string): boolean {
    const data = this.stateService.getData();
    const sourceRing = this.repositoryService.getRing(source, data);
    const targetRing = this.repositoryService.getRing(target, data);

    const sourceIsRepo =
      this.repositoryService.isRepositoryName(source) &&
      this.repositoryService.isValidRepository(source, data.entities || []);
    const targetIsRepo =
      this.repositoryService.isRepositoryName(target) &&
      this.repositoryService.isValidRepository(target, data.entities || []);

    if (!sourceRing && !sourceIsRepo) return false;
    if (!targetRing && !targetIsRepo) return false;
    if (
      sourceRing === OnionRing.DOMAIN_SERVICES &&
      targetRing !== OnionRing.ENTITIES
    )
      return false;
    if (
      sourceRing === OnionRing.APPLICATION_SERVICES &&
      targetRing !== OnionRing.DOMAIN_SERVICES &&
      !targetIsRepo
    )
      return false;
    if (sourceIsRepo && targetRing !== OnionRing.APPLICATION_SERVICES)
      return false;
    if (sourceRing === OnionRing.ENTITIES) return false;
    if (source === target) return false;

    return true;
  }

  private toggleAppDependency(
    appService: string,
    dependency: string,
    dependencyType: 'domainServices' | 'repositories' = 'domainServices'
  ): { success: boolean; message: string; data: OnionConfig } {
    const data = this.stateService.getData();

    if (!data.applicationServiceDependencies[appService]) {
      data.applicationServiceDependencies[appService] = {
        domainServices: [],
        repositories: [],
      };
    }

    const deps = data.applicationServiceDependencies[appService];
    const dependencyArray = deps[dependencyType];
    const index = dependencyArray.indexOf(dependency);

    if (index > -1) {
      dependencyArray.splice(index, 1);
      return {
        success: true,
        message: `Connection from "${appService}" to "${dependency}" removed`,
        data,
      };
    } else {
      dependencyArray.push(dependency);
      return {
        success: true,
        message: `Connection from "${appService}" to "${dependency}" added`,
        data,
      };
    }
  }

  private toggleRecordConnection(
    record: Record<string, string[]>,
    key: string,
    value: string
  ): { success: boolean; message: string; data: OnionConfig } {
    if (!record[key]) {
      record[key] = [];
    }

    const index = record[key].indexOf(value);
    if (index > -1) {
      record[key].splice(index, 1);
      return {
        success: true,
        message: `Connection from "${key}" to "${value}" removed`,
        data: this.stateService.getData(),
      };
    } else {
      record[key].push(value);
      return {
        success: true,
        message: `Connection from "${key}" to "${value}" added`,
        data: this.stateService.getData(),
      };
    }
  }
}
