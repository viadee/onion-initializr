import { NodeType } from '@onion-initializr/lib/domain/entities/node-type';
import { OnionConfig } from '@onion-initializr/lib/domain/entities/onion-config';
import { OnionConfigService } from '@onion-initializr/lib/domain/services/onion-config-service';
import { InputSanitizationService } from './input-sanitization-service';

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
  constructor(
    private readonly onionConfigService: OnionConfigService,
    private readonly sanitizationService: InputSanitizationService
  ) {}

  validateNodeName(name: string, data: OnionConfig): NodeValidationResult {
    // Use sanitization service for validation
    const validationResult = this.sanitizationService.validateNodeName(name);

    if (!validationResult.isValid) {
      return {
        isValid: false,
        errorMessage: validationResult.errorMessage,
      };
    }

    const sanitizedName = validationResult.sanitizedValue;

    // Check if name already exists
    const allNodes = [
      ...(data.entities || []),
      ...(data.domainServices || []),
      ...(data.applicationServices || []),
      ...this.getRepositories(data),
    ];

    if (allNodes.includes(sanitizedName)) {
      return {
        isValid: false,
        errorMessage: 'A node with this name already exists',
      };
    }

    return { isValid: true };
  }

  addNode(name: string, nodeType: NodeType): NodeOperationResult {
    // Use sanitization service for validation and sanitization
    const validationResult = this.sanitizationService.validateNodeName(name);

    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.errorMessage || 'Invalid node name',
      };
    }

    const capitalizedName =
      validationResult.sanitizedValue.charAt(0).toUpperCase() +
      validationResult.sanitizedValue.slice(1);
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
        console.log('Unknown node type');
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
