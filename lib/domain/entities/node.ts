import { NodeType, getNodeTypeDisplayName } from './node-type';
import { Entity } from './entity';
import { DomainService } from './domain-service';

export class Node {
  constructor(
    private readonly name: string,
    private readonly type: NodeType,
    private readonly entities: Entity[] = [],
    private readonly domainServices: DomainService[] = [],
    private readonly repositories: string[] = []
  ) {}

  public getName(): string {
    return this.name;
  }

  public getType(): NodeType {
    return this.type;
  }

  public getEntities(): Entity[] {
    return [...this.entities];
  }

  public getDomainServices(): DomainService[] {
    return [...this.domainServices];
  }

  public getRepositories(): string[] {
    return [...this.repositories];
  }

  public isEntity(): boolean {
    return this.type === NodeType.ENTITY;
  }

  public isDomainService(): boolean {
    return this.type === NodeType.DOMAIN_SERVICE;
  }

  public isApplicationService(): boolean {
    return this.type === NodeType.APPLICATION_SERVICE;
  }

  public isRepository(): boolean {
    return this.type === NodeType.REPOSITORY;
  }

  public equals(other: Node): boolean {
    return this.name === other.name && this.type === other.type;
  }

  public toString(): string {
    return `${getNodeTypeDisplayName(this.type)}: ${this.name}`;
  }
}
