import { OnionConfig } from '../Entities/onion-config';

export interface IOnionConfigRepository {
  save(data: OnionConfig, filename?: string): Promise<void>;
  loadInitialData(): Promise<OnionConfig>;
}
