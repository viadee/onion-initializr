export enum NodeType {
  ENTITY = 'entity',
  DOMAIN_SERVICE = 'domain',
  APPLICATION_SERVICE = 'application',
  REPOSITORY = 'repository',
}

export const NodeTypeDisplayNames = {
  [NodeType.ENTITY]: 'Entity',
  [NodeType.DOMAIN_SERVICE]: 'Domain Service',
  [NodeType.APPLICATION_SERVICE]: 'Application Service',
  [NodeType.REPOSITORY]: 'Repository',
} as const;

export function getNodeTypeDisplayName(nodeType: NodeType): string {
  return NodeTypeDisplayNames[nodeType];
}

export function getAllNodeTypes(): NodeType[] {
  return Object.values(NodeType);
}
