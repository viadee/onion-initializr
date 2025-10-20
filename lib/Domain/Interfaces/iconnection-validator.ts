import { OnionConfig } from '../Entities/onion-config';

/**
 * Interface for validating and managing connections between onion architecture layers
 */
export interface IConnectionValidator {
  /**
   * Add a connection between source and target nodes
   */
  addConnection(
    source: string,
    target: string
  ): {
    success: boolean;
    message: string;
    data: OnionConfig | null;
  };

  /**
   * Remove a connection between source and target nodes
   */
  removeConnection(
    source: string,
    target: string
  ): { success: boolean; message: string; data?: OnionConfig };

  /**
   * Check if a connection exists between source and target
   */
  hasConnection(source: string, target: string): boolean;

  /**
   * Get all possible targets for a given source node
   */
  getPossibleTargets(sourceNode: string): string[];

  /**
   * Get current targets for a given source node
   */
  getCurrentTargets(source: string): string[];

  /**
   * Validate if a connection between source and target is valid
   */
  validateConnection(source: string, target: string): boolean;
}
