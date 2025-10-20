import { DomainService } from '../../../../lib/domain/entities/domain-service';
import { Entity } from '../../../../lib/domain/entities/entity';
import { NodeType } from '../../../../lib/domain/entities/node-type';
import { OnionConfig } from '../../../../lib/domain/entities/onion-config';
import { NodeFactory } from '../../../../lib/domain/services/node-factory';

export interface NodeInfo {
  name: string;
  type: NodeType;
  entities: Entity[];
  domainServices: DomainService[];
  repositories: string[];
}

export class DiagramNodeInteractionAppService {
  private selectedNode: string | null = null;

  getSelectedNode(): string | null {
    return this.selectedNode;
  }

  setSelectedNode(node: string | null): void {
    this.selectedNode = node;
  }

  handleNodeSelection(clickedNode: string | null): string | null {
    if (!clickedNode) return null;

    // Toggle selection: if clicking the same node, deselect it
    this.selectedNode = this.selectedNode === clickedNode ? null : clickedNode;
    return this.selectedNode;
  }

  determineNodeInfo(clickedNode: string, data: OnionConfig): NodeInfo {
    const node = NodeFactory.createNode(clickedNode, data);

    return {
      name: node.getName(),
      type: node.getType(),
      entities: node.getEntities(),
      domainServices: node.getDomainServices(),
      repositories: node.getRepositories(),
    };
  }
}
