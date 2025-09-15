import { WebContainer } from '@webcontainer/api';
import { IFileRepository } from './IFileRepository';

/**
 * Interface for repositories that provide WebContainer functionality
 * Follows Interface Segregation Principle - only WebContainer-specific methods
 */
export interface IWebContainerRepository extends IFileRepository {
  getWebContainer(): Promise<WebContainer>;
}
