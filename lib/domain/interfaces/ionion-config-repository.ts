import { OnionConfig } from '../entities/onion-config';

export interface IOnionConfigRepository {
  save(data: OnionConfig, filename?: string): Promise<void>;
  loadInitialData(): Promise<OnionConfig>;
}
