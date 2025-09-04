import { OnionConfig } from '../Entities/OnionConfig';
import { OnionConfigStateService } from './OnionConfigStateService';

export class OnionConfigNodeService {
  constructor(private readonly stateService: OnionConfigStateService) {}

  addEntity(name: string): OnionConfig {
    return this.stateService.updateData(current => ({
      ...current,
      entities: [...(current.entities || []), name],
    }));
  }

  addDomainService(name: string): OnionConfig {
    return this.stateService.updateData(current => ({
      ...current,
      domainServices: [...(current.domainServices || []), name],
      domainServiceConnections: {
        ...(current.domainServiceConnections || {}),
        [name]: [],
      },
    }));
  }

  addApplicationService(name: string): OnionConfig {
    return this.stateService.updateData(current => ({
      ...current,
      applicationServices: [...(current.applicationServices || []), name],
      applicationServiceDependencies: {
        ...(current.applicationServiceDependencies || {}),
        [name]: {
          domainServices: [],
          repositories: [],
        },
      },
    }));
  }

  removeNode(name: string): OnionConfig {
    return this.stateService.updateData(current => {
      const newData: OnionConfig = { ...current };

      newData.entities = (newData.entities || []).filter(e => e !== name);

      if (newData.domainServices) {
        newData.domainServices = newData.domainServices.filter(d => d !== name);
        if (newData.domainServiceConnections) {
          delete newData.domainServiceConnections[name];
          for (const key of Object.keys(newData.domainServiceConnections)) {
            newData.domainServiceConnections[key] =
              newData.domainServiceConnections[key].filter(t => t !== name);
          }
        }
      }

      if (newData.applicationServices) {
        newData.applicationServices = newData.applicationServices.filter(
          a => a !== name
        );
        if (newData.applicationServiceDependencies) {
          delete newData.applicationServiceDependencies[name];
          for (const key of Object.keys(
            newData.applicationServiceDependencies
          )) {
            const deps = newData.applicationServiceDependencies[key];
            deps.domainServices = deps.domainServices.filter(s => s !== name);
          }
        }
      }

      return newData;
    });
  }
}
