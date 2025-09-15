import { NodeType } from '../../../../lib/Domain/Entities/NodeType';
import { OnionConfig } from '../../../../lib/Domain/Entities/OnionConfig';
import { OnionConfigService } from '../../../../lib/Domain/Services/OnionConfigService';

export interface NodeValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface NodeOperationResult {
  success: boolean;
  message: string;
  data?: OnionConfig;
  clearedNode?: string;
}

export class DiagramNodeManagementService {
  constructor(private readonly onionConfigService: OnionConfigService) {}

  validateNodeName(name: string, data: OnionConfig): NodeValidationResult {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return {
        isValid: false,
        errorMessage: 'Please enter a node name',
      };
    }

    // Check if name already exists
    const allNodes = [
      ...(data.entities || []),
      ...(data.domainServices || []),
      ...(data.applicationServices || []),
      ...this.getRepositories(data),
    ];

    if (allNodes.includes(trimmedName)) {
      return {
        isValid: false,
        errorMessage: 'A node with this name already exists',
      };
    }

    return { isValid: true };
  }

  addNode(name: string, nodeType: NodeType): NodeOperationResult {
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    const trimmedName = capitalizedName.trim();

    let data: OnionConfig;

    switch (nodeType) {
      case NodeType.ENTITY:
        data = this.onionConfigService.addEntity(trimmedName);
        break;
      case NodeType.DOMAIN_SERVICE:
        data = this.onionConfigService.addDomainService(trimmedName);
        break;
      case NodeType.APPLICATION_SERVICE:
        data = this.onionConfigService.addApplicationService(trimmedName);
        break;
      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }

    return {
      success: true,
      message: `${nodeType} "${trimmedName}" added successfully`,
      data,
    };
  }

  removeNode(selectedNode: string | null): NodeOperationResult {
    if (!selectedNode) {
      return {
        success: false,
        message: 'Please select a node to remove',
      };
    }

    const data = this.onionConfigService.removeNode(selectedNode);

    return {
      success: true,
      message: `Removed "${selectedNode}" successfully`,
      data,
      clearedNode: selectedNode,
    };
  }

  private getRepositories(data: OnionConfig): string[] {
    return data.entities?.map(entity => `I${entity}Repository`) || [];
  }
}
