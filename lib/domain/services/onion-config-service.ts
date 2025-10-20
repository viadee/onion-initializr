import { IConnectionValidator } from "../interfaces/iconnection-validator";
import { OnionConfigStateService } from "./onion-config-state-service";
import { OnionConfigNodeService } from "./onion-config-node-service";
import { OnionConfigRepositoryService } from "./onion-config-repository-service";
import { FileEntity } from '../entities/file-entity';
import { OnionConfig } from '../entities/onion-config';

/**
 * Facade service that coordinates all OnionConfig operations
 * Delegates specific responsibilities to focused services
 */
export class OnionConfigService {
  private isInitialized = false;

  constructor(
    private readonly stateService: OnionConfigStateService,
    private readonly nodeService: OnionConfigNodeService,
    private readonly connectionValidator: IConnectionValidator,
    private readonly repositoryService: OnionConfigRepositoryService
  ) {}

  getEmptyConfig(): OnionConfig {
    return this.stateService.getEmptyConfig();
  }

  async loadData(): Promise<OnionConfig> {
    // Initialize with default data on first load
    if (!this.isInitialized) {
      await this.stateService.initializeWithDefaultData();
      this.isInitialized = true;
    }
    return this.stateService.loadData();
  }

  async saveData(data: OnionConfig): Promise<void> {
    return this.stateService.saveData(data);
  }

  // Node Management
  addEntity(name: string): OnionConfig {
    return this.nodeService.addEntity(name);
  }

  addDomainService(name: string): OnionConfig {
    return this.nodeService.addDomainService(name);
  }

  addApplicationService(name: string): OnionConfig {
    return this.nodeService.addApplicationService(name);
  }

  removeNode(name: string): OnionConfig {
    return this.nodeService.removeNode(name);
  }

  // Connection Management
  addConnection(
    source: string,
    target: string
  ): {
    success: boolean;
    message: string;
    data: OnionConfig | null;
  } {
    return this.connectionValidator.addConnection(source, target);
  }

  removeConnection(
    source: string,
    target: string
  ): { success: boolean; message: string; data?: OnionConfig } {
    return this.connectionValidator.removeConnection(source, target);
  }

  hasConnection(source: string, target: string): boolean {
    return this.connectionValidator.hasConnection(source, target);
  }

  getPossibleTargets(sourceNode: string): string[] {
    return this.connectionValidator.getPossibleTargets(sourceNode);
  }

  getCurrentTargets(source: string): string[] {
    return this.connectionValidator.getCurrentTargets(source);
  }

  validateConnection(source: string, target: string): boolean {
    return this.connectionValidator.validateConnection(source, target);
  }

  // Repository Helper Methods
  isRepositoryName(name: string): boolean {
    return this.repositoryService.isRepositoryName(name);
  }

  isValidRepository(repoName: string): boolean {
    const data = this.stateService.getData();
    return this.repositoryService.isValidRepository(
      repoName,
      data.entities || []
    );
  }

  getRepositories(): string[] {
    const data = this.stateService.getData();
    return this.repositoryService.getRepositories(data.entities || []);
  }

  public mapFileToConfig(file: FileEntity): OnionConfig {
    const onionConfig = JSON.parse(file.content) as OnionConfig;
    return onionConfig;
  }
}
