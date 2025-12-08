import { UiLibrary } from './ui-library';
import { UIFrameworks } from './ui-framework';
import { DiFramework } from './di-framework';

/**
 * Domain Entity: OnionConfig
 */
export class OnionConfig {
  folderPath: string;
  entities: string[];
  domainServices: string[];
  applicationServices: string[];
  domainServiceConnections: Record<string, string[]>;
  applicationServiceDependencies: Record<
    string,
    {
      domainServices: string[];
      repositories: string[];
    }
  >;
  uiFramework: keyof UIFrameworks | undefined;
  diFramework: DiFramework | undefined;
  uiLibrary: UiLibrary | undefined;

  constructor(data: Partial<OnionConfig> = {}) {
    this.folderPath = data.folderPath ?? '';
    this.entities = data.entities ?? [];
    this.domainServices = data.domainServices ?? [];
    this.applicationServices = data.applicationServices ?? [];
    this.domainServiceConnections = data.domainServiceConnections ?? {};
    this.applicationServiceDependencies =
      data.applicationServiceDependencies ?? {};
    this.uiFramework = data.uiFramework;
    this.diFramework = data.diFramework ?? 'awilix';
    this.uiLibrary = data.uiLibrary;
  }

  static empty(): OnionConfig {
    return new OnionConfig();
  }
}
