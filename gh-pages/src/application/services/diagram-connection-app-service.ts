import { OnionConfig } from '@onion-initializr/lib/domain/entities/onion-config';
import { OnionConfigService } from '@onion-initializr/lib/domain/services/onion-config-service';

export interface ConnectionMode {
  active: boolean;
  sourceNode: string | null;
}

export interface ConnectionResult {
  success: boolean;
  message: string;
  data?: OnionConfig;
  shouldClearConnection?: boolean;
}

export class DiagramConnectionAppService {
  private readonly connectionMode: ConnectionMode = {
    active: true,
    sourceNode: null,
  };

  private availableTargets: string[] = [];

  constructor(private readonly onionConfigService: OnionConfigService) {}

  getConnectionMode(): ConnectionMode {
    return { ...this.connectionMode };
  }

  getAvailableTargets(): string[] {
    return [...this.availableTargets];
  }

  handleConnectionModeClick(clickedNode: string): ConnectionResult {
    if (!this.connectionMode.sourceNode) {
      // First click - select source
      this.connectionMode.sourceNode = clickedNode;
      this.availableTargets =
        this.onionConfigService.getPossibleTargets(clickedNode);

      if (this.availableTargets.length === 0) {
        this.connectionMode.sourceNode = null;
        this.availableTargets = [];
        return {
          success: false,
          message: 'This node cannot initiate connections',
          shouldClearConnection: true,
        };
      }

      return {
        success: true,
        message: `Selected ${clickedNode} as source. Click target node to connect.`,
      };
    }

    // Second click - attempt connection
    const result = this.onionConfigService.addConnection(
      this.connectionMode.sourceNode,
      clickedNode
    );

    this.connectionMode.sourceNode = null;
    this.availableTargets = [];

    return {
      success: result.success,
      message: result.message,
      data: result.data || undefined,
      shouldClearConnection: true,
    };
  }

  removeConnection(sourceNode: string, targetNode: string): ConnectionResult {
    const result = this.onionConfigService.removeConnection(
      sourceNode,
      targetNode
    );

    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  getCurrentConnections(selectedNode: string | null): string[] {
    if (!selectedNode) {
      return [];
    }
    return this.onionConfigService.getCurrentTargets(selectedNode);
  }

  canInitiateConnections(selectedNode: string | null): boolean {
    if (!selectedNode) {
      return false;
    }
    return this.onionConfigService.getPossibleTargets(selectedNode).length > 0;
  }

  resetConnectionMode(): void {
    this.connectionMode.sourceNode = null;
    this.availableTargets = [];
  }
}
