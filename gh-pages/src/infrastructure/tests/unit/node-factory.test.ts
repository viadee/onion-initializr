import { expect } from 'chai';
import { DomainService } from '../../../../../lib/domain/entities/domain-service';
import { Entity } from '../../../../../lib/domain/entities/entity';
import { NodeType } from '../../../../../lib/domain/entities/node-type';
import { OnionConfig } from '../../../../../lib/domain/entities/onion-config';
import { NodeFactory } from '../../../../../lib/domain/services/node-factory';


describe('NodeFactory', () => {
  // Helper function to create mock config
  const createMockConfig = (): OnionConfig => ({
    folderPath: '/test/project',
    entities: ['User', 'Product', 'Order'],
    domainServices: ['UserService', 'ProductService', 'OrderService'],
    applicationServices: ['UserAppService', 'ProductAppService'],
    domainServiceConnections: {
      UserService: ['User'],
      ProductService: ['Product'],
      OrderService: ['Order', 'User'],
    },
    applicationServiceDependencies: {
      UserAppService: {
        domainServices: ['UserService'],
        repositories: ['IUserRepository'],
      },
      ProductAppService: {
        domainServices: ['ProductService', 'OrderService'],
        repositories: ['IProductRepository', 'IOrderRepository'],
      },
    },
    uiFramework: 'react',
    diFramework: 'awilix',
    uiLibrary: 'shadcn',
  });

  describe('createNode', () => {
    it('should create an entity node with correct properties', () => {
      const config = createMockConfig();
      const node = NodeFactory.createNode('User', config);

      expect(node.getName()).to.equal('User');
      expect(node.getType()).to.equal(NodeType.ENTITY);
      expect(node.getEntities()).to.deep.equal([]);
      expect(node.getDomainServices()).to.deep.equal([]);
      expect(node.getRepositories()).to.deep.equal([]);
    });

    it('should create a domain service node with connected entities', () => {
      const config = createMockConfig();
      const node = NodeFactory.createNode('UserService', config);

      expect(node.getName()).to.equal('UserService');
      expect(node.getType()).to.equal(NodeType.DOMAIN_SERVICE);
      expect(node.getEntities()).to.have.lengthOf(1);
      expect(node.getEntities()[0]).to.be.instanceOf(Entity);
      expect(node.getEntities()[0].name).to.equal('User');
      expect(node.getDomainServices()).to.deep.equal([]);
      expect(node.getRepositories()).to.deep.equal([]);
    });

    it('should create a domain service node with multiple connected entities', () => {
      const config = createMockConfig();
      const node = NodeFactory.createNode('OrderService', config);

      expect(node.getName()).to.equal('OrderService');
      expect(node.getType()).to.equal(NodeType.DOMAIN_SERVICE);
      expect(node.getEntities()).to.have.lengthOf(2);
      expect(node.getEntities().map(e => e.name)).to.deep.equal([
        'Order',
        'User',
      ]);
    });

    it('should create an application service node with connected domain services and repositories', () => {
      const config = createMockConfig();
      const node = NodeFactory.createNode('UserAppService', config);

      expect(node.getName()).to.equal('UserAppService');
      expect(node.getType()).to.equal(NodeType.APPLICATION_SERVICE);
      expect(node.getEntities()).to.deep.equal([]);
      expect(node.getDomainServices()).to.have.lengthOf(1);
      expect(node.getDomainServices()[0]).to.be.instanceOf(DomainService);
      expect(node.getDomainServices()[0].serviceName).to.equal('UserService');
      expect(node.getRepositories()).to.deep.equal(['IUserRepository']);
    });

    it('should create an application service node with multiple dependencies', () => {
      const config = createMockConfig();
      const node = NodeFactory.createNode('ProductAppService', config);

      expect(node.getName()).to.equal('ProductAppService');
      expect(node.getType()).to.equal(NodeType.APPLICATION_SERVICE);
      expect(node.getDomainServices()).to.have.lengthOf(2);
      expect(node.getDomainServices().map(d => d.serviceName)).to.deep.equal([
        'ProductService',
        'OrderService',
      ]);
      expect(node.getRepositories()).to.deep.equal([
        'IProductRepository',
        'IOrderRepository',
      ]);
    });

    it('should create a repository node', () => {
      const config = createMockConfig();
      const node = NodeFactory.createNode('IUserRepository', config);

      expect(node.getName()).to.equal('IUserRepository');
      expect(node.getType()).to.equal(NodeType.REPOSITORY);
      expect(node.getEntities()).to.deep.equal([]);
      expect(node.getDomainServices()).to.deep.equal([]);
      expect(node.getRepositories()).to.deep.equal([]);
    });

    it('should throw error for unknown node type', () => {
      const config = createMockConfig();

      expect(() => NodeFactory.createNode('UnknownNode', config)).to.throw(
        'Unknown node type for: UnknownNode'
      );
    });

    it('should handle empty config gracefully', () => {
      const emptyConfig: OnionConfig = {
        folderPath: '',
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'vanilla',
        diFramework: 'awilix',
      };

      expect(() => NodeFactory.createNode('AnyNode', emptyConfig)).to.throw(
        'Unknown node type for: AnyNode'
      );
    });

    it('should handle undefined arrays in config', () => {
      const incompleteConfig: OnionConfig = {
        folderPath: '',
        entities: undefined as unknown as string[],
        domainServices: undefined as unknown as string[],
        applicationServices: undefined as unknown as string[],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'vanilla',
        diFramework: 'awilix',
      };

      expect(() =>
        NodeFactory.createNode('AnyNode', incompleteConfig)
      ).to.throw('Unknown node type for: AnyNode');
    });

    it('should handle domain service with no connections', () => {
      const config = createMockConfig();
      config.domainServiceConnections = {};
      const node = NodeFactory.createNode('UserService', config);

      expect(node.getEntities()).to.deep.equal([]);
    });

    it('should handle application service with no dependencies', () => {
      const config = createMockConfig();
      config.applicationServiceDependencies = {};
      const node = NodeFactory.createNode('UserAppService', config);

      expect(node.getDomainServices()).to.deep.equal([]);
      expect(node.getRepositories()).to.deep.equal([]);
    });

    it('should filter out invalid entity connections in domain service', () => {
      const config = createMockConfig();
      config.domainServiceConnections = {
        UserService: ['User', 'NonExistentEntity'],
      };
      const node = NodeFactory.createNode('UserService', config);

      expect(node.getEntities()).to.have.lengthOf(1);
      expect(node.getEntities()[0].name).to.equal('User');
    });

    it('should handle missing domainServiceConnections property', () => {
      const config = createMockConfig();
      config.domainServiceConnections = undefined as unknown as Record<
        string,
        string[]
      >;
      const node = NodeFactory.createNode('UserService', config);

      expect(node.getEntities()).to.deep.equal([]);
    });

    it('should handle missing applicationServiceDependencies property', () => {
      const config = createMockConfig();
      config.applicationServiceDependencies = undefined as unknown as Record<
        string,
        { domainServices: string[]; repositories: string[] }
      >;
      const node = NodeFactory.createNode('UserAppService', config);

      expect(node.getDomainServices()).to.deep.equal([]);
      expect(node.getRepositories()).to.deep.equal([]);
    });
  });
});
