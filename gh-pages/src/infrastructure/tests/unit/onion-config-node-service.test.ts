import { expect } from 'chai';
import { OnionConfigNodeService } from '../../../Domain/Services/OnionConfigNodeService';
import { OnionConfigStateService } from '../../../Domain/Services/OnionConfigStateService';
import { OnionConfig } from '../../../Domain/Entities/OnionConfig';

describe('OnionConfigNodeService', () => {
  let nodeService: OnionConfigNodeService;
  let mockStateService: Partial<OnionConfigStateService>;
  let mockConfig: OnionConfig;

  // Helper function to create mock configuration
  const createMockConfig = (): OnionConfig => ({
    folderPath: '/test/project',
    entities: ['User', 'Product'],
    domainServices: ['UserService'],
    applicationServices: ['UserAppService'],
    domainServiceConnections: {
      UserService: ['User'],
    },
    applicationServiceDependencies: {
      UserAppService: {
        domainServices: ['UserService'],
        repositories: ['IUserRepository'],
      },
    },
    uiFramework: 'react',
    diFramework: 'awilix',
  });

  beforeEach(() => {
    mockConfig = createMockConfig();

    mockStateService = {
      updateData: (updateFunction: (config: OnionConfig) => OnionConfig) => {
        mockConfig = updateFunction(mockConfig);
        return mockConfig;
      },
      getData: () => mockConfig,
    };

    nodeService = new OnionConfigNodeService(
      mockStateService as OnionConfigStateService
    );
  });

  describe('addEntity', () => {
    it('should add a new entity to the configuration', () => {
      const result = nodeService.addEntity('Order');

      expect(result.entities).to.include('Order');
      expect(result.entities).to.have.lengthOf(3);
      expect(result.entities).to.deep.equal(['User', 'Product', 'Order']);
    });

    it('should add duplicate entities (no deduplication)', () => {
      const result = nodeService.addEntity('User');

      expect(result.entities).to.have.lengthOf(3);
      expect(result.entities).to.deep.equal(['User', 'Product', 'User']);
    });

    it('should add empty entity names', () => {
      const result = nodeService.addEntity('');

      expect(result.entities).to.have.lengthOf(3);
      expect(result.entities).to.deep.equal(['User', 'Product', '']);
    });

    it('should add null or undefined entity names', () => {
      const result1 = nodeService.addEntity(null as unknown as string);
      const result2 = nodeService.addEntity(undefined as unknown as string);

      expect(result1.entities).to.have.lengthOf(3);
      expect(result2.entities).to.have.lengthOf(4); // Note: using previous result
    });

    it('should update the state service when adding an entity', () => {
      let updateCalled = false;
      mockStateService.updateData = (
        updateFunction: (config: OnionConfig) => OnionConfig
      ) => {
        updateCalled = true;
        mockConfig = updateFunction(mockConfig);
        return mockConfig;
      };

      nodeService.addEntity('Order');

      expect(updateCalled).to.be.true;
    });

    it('should maintain existing entities when adding new one', () => {
      const result = nodeService.addEntity('Customer');

      expect(result.entities).to.include('User');
      expect(result.entities).to.include('Product');
      expect(result.entities).to.include('Customer');
    });

    it('should handle special characters in entity names', () => {
      const result = nodeService.addEntity('User_Profile');

      expect(result.entities).to.include('User_Profile');
    });
  });

  describe('addDomainService', () => {
    it('should add a new domain service to the configuration', () => {
      const result = nodeService.addDomainService('ProductService');

      expect(result.domainServices).to.include('ProductService');
      expect(result.domainServices).to.have.lengthOf(2);
    });

    it('should add duplicate domain services (no deduplication)', () => {
      const result = nodeService.addDomainService('UserService');

      expect(result.domainServices).to.have.lengthOf(2);
      expect(result.domainServices).to.deep.equal([
        'UserService',
        'UserService',
      ]);
    });

    it('should add empty domain service names', () => {
      const result = nodeService.addDomainService('');

      expect(result.domainServices).to.have.lengthOf(2);
      expect(result.domainServices).to.deep.equal(['UserService', '']);
    });

    it('should add null or undefined domain service names', () => {
      const result1 = nodeService.addDomainService(null as unknown as string);
      const result2 = nodeService.addDomainService(
        undefined as unknown as string
      );

      expect(result1.domainServices).to.have.lengthOf(2);
      expect(result2.domainServices).to.have.lengthOf(3); // Note: using previous result
    });

    it('should maintain existing domain services when adding new one', () => {
      const result = nodeService.addDomainService('OrderService');

      expect(result.domainServices).to.include('UserService');
      expect(result.domainServices).to.include('OrderService');
    });

    it('should update the state service when adding a domain service', () => {
      let updateCalled = false;
      mockStateService.updateData = (
        updateFunction: (config: OnionConfig) => OnionConfig
      ) => {
        updateCalled = true;
        mockConfig = updateFunction(mockConfig);
        return mockConfig;
      };

      nodeService.addDomainService('ProductService');

      expect(updateCalled).to.be.true;
    });
  });

  describe('addApplicationService', () => {
    it('should add a new application service to the configuration', () => {
      const result = nodeService.addApplicationService('ProductAppService');

      expect(result.applicationServices).to.include('ProductAppService');
      expect(result.applicationServices).to.have.lengthOf(2);
    });

    it('should add duplicate application services (no deduplication)', () => {
      const result = nodeService.addApplicationService('UserAppService');

      expect(result.applicationServices).to.have.lengthOf(2);
      expect(result.applicationServices).to.deep.equal([
        'UserAppService',
        'UserAppService',
      ]);
    });

    it('should add empty application service names', () => {
      const result = nodeService.addApplicationService('');

      expect(result.applicationServices).to.have.lengthOf(2);
      expect(result.applicationServices).to.deep.equal(['UserAppService', '']);
    });

    it('should add null or undefined application service names', () => {
      const result1 = nodeService.addApplicationService(
        null as unknown as string
      );
      const result2 = nodeService.addApplicationService(
        undefined as unknown as string
      );

      expect(result1.applicationServices).to.have.lengthOf(2);
      expect(result2.applicationServices).to.have.lengthOf(3); // Note: using previous result
    });

    it('should maintain existing application services when adding new one', () => {
      const result = nodeService.addApplicationService('OrderAppService');

      expect(result.applicationServices).to.include('UserAppService');
      expect(result.applicationServices).to.include('OrderAppService');
    });

    it('should update the state service when adding an application service', () => {
      let updateCalled = false;
      mockStateService.updateData = (
        updateFunction: (config: OnionConfig) => OnionConfig
      ) => {
        updateCalled = true;
        mockConfig = updateFunction(mockConfig);
        return mockConfig;
      };

      nodeService.addApplicationService('ProductAppService');

      expect(updateCalled).to.be.true;
    });
  });

  describe('removeNode', () => {
    beforeEach(() => {
      // Set up a more complex configuration for removal testing
      mockConfig = {
        ...mockConfig,
        entities: ['User', 'Product', 'Order'],
        domainServices: ['UserService', 'ProductService'],
        applicationServices: ['UserAppService', 'ProductAppService'],
        domainServiceConnections: {
          UserService: ['User'],
          ProductService: ['Product'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService'],
            repositories: ['IUserRepository'],
          },
          ProductAppService: {
            domainServices: ['ProductService'],
            repositories: ['IProductRepository'],
          },
        },
      };
    });

    it('should remove an entity from the configuration', () => {
      const result = nodeService.removeNode('Product');

      expect(result.entities).to.not.include('Product');
      expect(result.entities).to.have.lengthOf(2);
      expect(result.entities).to.deep.equal(['User', 'Order']);
    });

    it('should remove a domain service from the configuration', () => {
      const result = nodeService.removeNode('ProductService');

      expect(result.domainServices).to.not.include('ProductService');
      expect(result.domainServices).to.have.lengthOf(1);
      expect(result.domainServices).to.deep.equal(['UserService']);
    });

    it('should remove an application service from the configuration', () => {
      const result = nodeService.removeNode('ProductAppService');

      expect(result.applicationServices).to.not.include('ProductAppService');
      expect(result.applicationServices).to.have.lengthOf(1);
      expect(result.applicationServices).to.deep.equal(['UserAppService']);
    });

    it('should remove domain service connections when removing a domain service', () => {
      const result = nodeService.removeNode('ProductService');

      expect(result.domainServiceConnections).to.not.have.property(
        'ProductService'
      );
      expect(result.domainServiceConnections).to.have.property('UserService');
    });

    it('should remove application service dependencies when removing an application service', () => {
      const result = nodeService.removeNode('ProductAppService');

      expect(result.applicationServiceDependencies).to.not.have.property(
        'ProductAppService'
      );
      expect(result.applicationServiceDependencies).to.have.property(
        'UserAppService'
      );
    });

    it('should remove entity references from domain service connections when removing an entity', () => {
      // Add Product to UserService connections first
      mockConfig.domainServiceConnections['UserService'] = ['User', 'Product'];

      const result = nodeService.removeNode('Product');

      expect(result.domainServiceConnections['UserService']).to.not.include(
        'Product'
      );
      expect(result.domainServiceConnections['UserService']).to.include('User');
    });

    it('should remove domain service references from application service dependencies', () => {
      // Add ProductService to UserAppService dependencies
      mockConfig.applicationServiceDependencies[
        'UserAppService'
      ].domainServices = ['UserService', 'ProductService'];

      const result = nodeService.removeNode('ProductService');

      expect(
        result.applicationServiceDependencies['UserAppService'].domainServices
      ).to.not.include('ProductService');
      expect(
        result.applicationServiceDependencies['UserAppService'].domainServices
      ).to.include('UserService');
    });

    it('should handle removing non-existent nodes gracefully', () => {
      const result = nodeService.removeNode('NonExistentNode');

      // Configuration should remain unchanged
      expect(result.entities).to.deep.equal(['User', 'Product', 'Order']);
      expect(result.domainServices).to.deep.equal([
        'UserService',
        'ProductService',
      ]);
      expect(result.applicationServices).to.deep.equal([
        'UserAppService',
        'ProductAppService',
      ]);
    });

    it('should handle empty node names', () => {
      const result = nodeService.removeNode('');

      // Configuration should remain unchanged
      expect(result.entities).to.deep.equal(['User', 'Product', 'Order']);
    });

    it('should handle null or undefined node names', () => {
      const result1 = nodeService.removeNode(null as unknown as string);
      const result2 = nodeService.removeNode(undefined as unknown as string);

      // Configuration should remain unchanged
      expect(result1.entities).to.deep.equal(['User', 'Product', 'Order']);
      expect(result2.entities).to.deep.equal(['User', 'Product', 'Order']);
    });

    it('should update the state service when removing a node', () => {
      let updateCalled = false;
      mockStateService.updateData = (
        updateFunction: (config: OnionConfig) => OnionConfig
      ) => {
        updateCalled = true;
        mockConfig = updateFunction(mockConfig);
        return mockConfig;
      };

      nodeService.removeNode('Product');

      expect(updateCalled).to.be.true;
    });

    it('should handle complex removal scenarios', () => {
      // Remove an entity that is referenced in multiple places
      mockConfig.domainServiceConnections['UserService'] = ['User', 'Product'];
      mockConfig.domainServiceConnections['ProductService'] = ['Product'];

      const result = nodeService.removeNode('Product');

      // Entity should be removed from all references
      expect(result.entities).to.not.include('Product');
      expect(result.domainServiceConnections['UserService']).to.not.include(
        'Product'
      );
      expect(result.domainServiceConnections['ProductService']).to.not.include(
        'Product'
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined arrays in configuration', () => {
      mockConfig.entities = undefined as unknown as string[];
      mockConfig.domainServices = undefined as unknown as string[];
      mockConfig.applicationServices = undefined as unknown as string[];

      expect(() => nodeService.addEntity('TestEntity')).to.not.throw();
      expect(() => nodeService.addDomainService('TestService')).to.not.throw();
      expect(() =>
        nodeService.addApplicationService('TestAppService')
      ).to.not.throw();
    });

    it('should handle null configuration objects', () => {
      mockStateService.getData = () => null as unknown as OnionConfig;

      expect(() => nodeService.addEntity('TestEntity')).to.not.throw();
    });

    it('should handle malformed configuration objects', () => {
      mockStateService.getData = () => ({}) as OnionConfig;

      expect(() => nodeService.addEntity('TestEntity')).to.not.throw();
      expect(() => nodeService.removeNode('AnyNode')).to.not.throw();
    });

    it('should handle state service update errors gracefully', () => {
      mockStateService.updateData = () => {
        throw new Error('State update failed');
      };

      expect(() => nodeService.addEntity('TestEntity')).to.throw(
        'State update failed'
      );
    });
  });

  describe('integration with state service', () => {
    it('should correctly integrate with state service for all operations', () => {
      const testOperations = [
        { fn: () => nodeService.addEntity('NewEntity'), name: 'addEntity' },
        {
          fn: () => nodeService.addDomainService('NewDomainService'),
          name: 'addDomainService',
        },
        {
          fn: () => nodeService.addApplicationService('NewAppService'),
          name: 'addApplicationService',
        },
        { fn: () => nodeService.removeNode('User'), name: 'removeNode' },
      ];

      testOperations.forEach(({ fn, name }) => {
        let updateDataCalled = false;

        // Reset for each operation
        mockStateService.getData = () => {
          return mockConfig;
        };

        mockStateService.updateData = (
          updateFunction: (config: OnionConfig) => OnionConfig
        ) => {
          updateDataCalled = true;
          mockConfig = updateFunction(mockConfig);
          return mockConfig;
        };

        fn();

        expect(updateDataCalled, `updateData should be called for ${name}`).to
          .be.true;
      });
    });

    it('should maintain state consistency across multiple operations', () => {
      // Perform multiple operations
      nodeService.addEntity('Customer');
      nodeService.addDomainService('CustomerService');
      nodeService.addApplicationService('CustomerAppService');

      const finalState = mockStateService.getData!();

      expect(finalState.entities).to.include('Customer');
      expect(finalState.domainServices).to.include('CustomerService');
      expect(finalState.applicationServices).to.include('CustomerAppService');
    });
  });
});
