import { OnionConfig } from '../Entities/OnionConfig';
import { UIFrameworks } from '../Entities/UiFramework';
import { IOnionConfigRepository } from '../Interfaces/IOnionConfigRepository';
import { DiFramework } from '../Entities/DiFramework';

export class OnionConfigStateService {
  private data: OnionConfig;

  constructor(private readonly onionConfigRepository: IOnionConfigRepository) {
    // Initialize with empty config by default
    this.data = this.getEmptyConfig();
  }

  async initializeWithDefaultData(): Promise<OnionConfig> {
    try {
      // Load initial data through repository and set it as current data
      this.data = await this.onionConfigRepository.loadInitialData();
      return this.data;
    } catch (error) {
      console.error('Failed to load initial data:', error);
      return this.data;
    }
  }

  getEmptyConfig(): OnionConfig {
    const emptyConfig: OnionConfig = {
      folderPath: '',
      entities: [],
      domainServices: [],
      applicationServices: [],
      domainServiceConnections: {},
      applicationServiceDependencies: {},
      uiFramework: 'vanilla' as keyof UIFrameworks,
      diFramework: 'awilix' as DiFramework,
    };

    this.data = emptyConfig;
    return emptyConfig;
  }

  async loadData(): Promise<OnionConfig> {
    return this.data;
  }

  async saveData(data: OnionConfig): Promise<void> {
    this.onionConfigRepository.save(data, 'onion-config.json');
  }

  getData(): OnionConfig {
    return this.data;
  }

  setData(data: OnionConfig): void {
    this.data = data;
  }

  updateData(updater: (current: OnionConfig) => OnionConfig): OnionConfig {
    this.data = updater(this.data);
    return this.data;
  }
}
