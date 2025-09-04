import { Node } from '../Entities/Node';
import { NodeType } from '../Entities/NodeType';
import { Entity } from '../Entities/Entity';
import { DomainService } from '../Entities/DomainService';
import { OnionConfig } from '../Entities/OnionConfig';

export class NodeFactory {
  public static createNode(nodeName: string, data: OnionConfig): Node {
    const nodeType = this.determineNodeType(nodeName, data);
    const entities = this.getConnectedEntities(nodeName, nodeType, data);
    const domainServices = this.getConnectedDomainServices(
      nodeName,
      nodeType,
      data
    );
    const repositories = this.getConnectedRepositories(
      nodeName,
      nodeType,
      data
    );

    return new Node(nodeName, nodeType, entities, domainServices, repositories);
  }

  private static determineNodeType(
    nodeName: string,
    data: OnionConfig
  ): NodeType {
    if (data.entities?.includes(nodeName)) {
      return NodeType.ENTITY;
    }

    if (data.domainServices?.includes(nodeName)) {
      return NodeType.DOMAIN_SERVICE;
    }

    if (data.applicationServices?.includes(nodeName)) {
      return NodeType.APPLICATION_SERVICE;
    }

    const repositoryList = this.getRepositories(data);
    if (repositoryList.includes(nodeName)) {
      return NodeType.REPOSITORY;
    }

    throw new Error(`Unknown node type for: ${nodeName}`);
  }

  private static getConnectedEntities(
    nodeName: string,
    nodeType: NodeType,
    data: OnionConfig
  ): Entity[] {
    if (nodeType !== NodeType.DOMAIN_SERVICE) {
      return [];
    }

    const connections = data.domainServiceConnections?.[nodeName] || [];
    return connections
      .filter(entityName => data.entities?.includes(entityName))
      .map(entityName => new Entity(entityName));
  }

  private static getConnectedDomainServices(
    nodeName: string,
    nodeType: NodeType,
    data: OnionConfig
  ): DomainService[] {
    if (nodeType !== NodeType.APPLICATION_SERVICE) {
      return [];
    }

    const dependencies = data.applicationServiceDependencies?.[nodeName];
    const domainServiceNames = dependencies?.domainServices || [];
    return domainServiceNames.map(
      serviceName => new DomainService(serviceName, [])
    );
  }

  private static getConnectedRepositories(
    nodeName: string,
    nodeType: NodeType,
    data: OnionConfig
  ): string[] {
    if (nodeType !== NodeType.APPLICATION_SERVICE) {
      return [];
    }

    const dependencies = data.applicationServiceDependencies?.[nodeName];
    return dependencies?.repositories || [];
  }

  private static getRepositories(data: OnionConfig): string[] {
    return data.entities?.map(entity => `I${entity}Repository`) || [];
  }
}
