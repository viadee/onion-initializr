import { expect } from 'chai';
import { OnionConfigService } from '../../../domain/services/OnionConfigService';
import { OnionConfig } from '../../../domain/entities/OnionConfig';
import { FileEntity } from '../../../domain/entities/FileEntity';
import { OnionConfigStateService } from '../../../domain/services/OnionConfigStateService';
import { OnionConfigNodeService } from '../../../domain/services/OnionConfigNodeService';
import { OnionConfigConnectionAppService } from '../../../application/services/OnionConfigConnectionAppService';
import { OnionConfigRepositoryService } from '../../../domain/services/OnionConfigRepositoryService';

describe('OnionConfigService', () => {
  let service: OnionConfigService;
  let mockStateService: Partial<OnionConfigStateService>;
  let mockNodeService: Partial<OnionConfigNodeService>;
  let mockConnectionService: Partial<OnionConfigConnectionAppService>;
  let mockRepositoryService: Partial<OnionConfigRepositoryService>;

  // Helper functions to avoid deep nesting
  const setupFailedConnection = () => {
    mockConnectionService.addConnection = () => ({
      success: false,
      message: 'Connection failed: Invalid target',
      data: null,
    });
  };

  const setupFailedRemoveConnection = () => {
    mockConnectionService.removeConnection = () => ({
      success: false,
      message: 'Connection not found',
      data: undefined,
    });
  };

  const setupFalseConnectionCheck = () => {
    mockConnectionService.hasConnection = () => false;
  };

  const setupEmptyTargets = () => {
    mockConnectionService.getPossibleTargets = () => [];
  };

  const setupFalseValidation = () => {
    mockConnectionService.validateConnection = () => false;
  };

  const setupInvalidRepository = () => {
    mockRepositoryService.isValidRepository = () => false;
  };

  const setupEmptyEntityConfig = () => {
    mockStateService.getData = () => {
      const config = createMockConfig();
      config.entities = [];
      return config;
    };
    mockRepositoryService.getRepositories = () => [];
  };

  const setupFailedStateService = () => {
    mockStateService.loadData = async () => {
      throw new Error('State service failed');
    };
  };

  const setupFailedNodeService = () => {
    mockNodeService.addEntity = () => {
      throw new Error('Node service failed');
    };
  };

  const createMockConfig = (): OnionConfig =>
    new OnionConfig({
      folderPath: '/test/project',
      entities: ['User', 'Product'],
      domainServices: ['UserService', 'ProductService'],
      applicationServices: ['UserAppService'],
      domainServiceConnections: {
        UserService: ['User'],
        ProductService: ['Product'],
      },
      applicationServiceDependencies: {
        UserAppService: {
          domainServices: ['UserService'],
          repositories: ['UserRepository'],
        },
      },
      uiFramework: 'angular',
      diFramework: 'awilix',
    });

  beforeEach(() => {
    mockStateService = {
      getEmptyConfig: () => OnionConfig.empty(),
      initializeWithDefaultData: async () => createMockConfig(),
      loadData: async () => createMockConfig(),
      saveData: async () => Promise.resolve(),
      getData: () => createMockConfig(),
    };

    mockNodeService = {
      addEntity: (name: string) => {
        const config = createMockConfig();
        config.entities.push(name);
        return config;
      },
      addDomainService: (name: string) => {
        const config = createMockConfig();
        config.domainServices.push(name);
        return config;
      },
      addApplicationService: (name: string) => {
        const config = createMockConfig();
        config.applicationServices.push(name);
        return config;
      },
      removeNode: (name: string) => {
        const config = createMockConfig();
        config.entities = config.entities.filter((e: string) => e !== name);
        config.domainServices = config.domainServices.filter(
          (ds: string) => ds !== name
        );
        config.applicationServices = config.applicationServices.filter(
          (as: string) => as !== name
        );
        return config;
      },
    };

    mockConnectionService = {
      addConnection: () => ({
        success: true,
        message: 'Connection added successfully',
        data: createMockConfig(),
      }),
      removeConnection: () => ({
        success: true,
        message: 'Connection removed successfully',
        data: createMockConfig(),
      }),
      hasConnection: () => true,
      getPossibleTargets: () => ['User', 'Product'],
      getCurrentTargets: () => ['User'],
      validateConnection: () => true,
    };

    mockRepositoryService = {
      isRepositoryName: (name: string) => name.endsWith('Repository'),
      isValidRepository: (repoName: string, entities: string[]) =>
        entities.some(entity => repoName === `${entity}Repository`),
      getRepositories: (entities: string[]) =>
        entities.map(entity => `${entity}Repository`),
    };

    service = new OnionConfigService(
      mockStateService as OnionConfigStateService,
      mockNodeService as OnionConfigNodeService,
      mockConnectionService as OnionConfigConnectionAppService,
      mockRepositoryService as OnionConfigRepositoryService
    );
  });

  describe('getEmptyConfig', () => {
    it('should return an empty configuration object', () => {
      const result = service.getEmptyConfig();
      const expected = OnionConfig.empty();

      expect(result.folderPath).to.equal(expected.folderPath);
      expect(result.entities).to.deep.equal(expected.entities);
      expect(result.domainServices).to.deep.equal(expected.domainServices);
      expect(result.applicationServices).to.deep.equal(
        expected.applicationServices
      );
    });

    it('should delegate to state service getEmptyConfig method', () => {
      let delegateCalled = false;
      mockStateService.getEmptyConfig = () => {
        delegateCalled = true;
        return OnionConfig.empty();
      };

      service.getEmptyConfig();
      expect(delegateCalled).to.be.true;
    });
  });

  describe('loadData', () => {
    it('should initialize with default data and return configuration', async () => {
      let initializeCalled = false;
      mockStateService.initializeWithDefaultData = async () => {
        initializeCalled = true;
        return createMockConfig();
      };

      const result = await service.loadData();

      expect(initializeCalled).to.be.true;
      expect(result.folderPath).to.equal('/test/project');
      expect(result.entities).to.include('User');
    });

    it('should set isInitialized flag to prevent re-initialization', async () => {
      let initializeCallCount = 0;
      mockStateService.initializeWithDefaultData = async () => {
        initializeCallCount++;
        return createMockConfig();
      };

      await service.loadData();
      await service.loadData();

      expect(initializeCallCount).to.equal(1);
    });

    it('should handle initialization errors gracefully', async () => {
      mockStateService.initializeWithDefaultData = async () => {
        throw new Error('Initialization failed');
      };

      // The error should not be handled gracefully in loadData, it should propagate
      let errorCaught = false;
      try {
        await service.loadData();
      } catch (error) {
        errorCaught = true;
        expect((error as Error).message).to.equal('Initialization failed');
      }

      expect(errorCaught).to.be.true;
    });
  });

  describe('saveData', () => {
    it('should delegate to state service saveData method', async () => {
      const testConfig = createMockConfig();
      let savedConfig: OnionConfig | undefined;

      mockStateService.saveData = async (data: OnionConfig) => {
        savedConfig = data;
      };

      await service.saveData(testConfig);
      expect(savedConfig).to.equal(testConfig);
    });

    it('should handle save operation without throwing errors', async () => {
      const testConfig = createMockConfig();

      let errorThrown = false;
      try {
        await service.saveData(testConfig);
      } catch {
        errorThrown = true;
      }

      expect(errorThrown).to.be.false;
    });

    it('should propagate save errors from state service', async () => {
      const testConfig = createMockConfig();
      mockStateService.saveData = async () => {
        throw new Error('Save failed');
      };

      let errorCaught = false;
      try {
        await service.saveData(testConfig);
      } catch (error) {
        errorCaught = true;
        expect((error as Error).message).to.equal('Save failed');
      }

      expect(errorCaught).to.be.true;
    });
  });

  describe('Node Management', () => {
    describe('addEntity', () => {
      it('should add entity through node service and return updated config', () => {
        const result = service.addEntity('Order');

        expect(result.entities).to.include('Order');
        expect(result.entities).to.deep.equal(['User', 'Product', 'Order']);
      });

      it('should handle empty entity names', () => {
        const result = service.addEntity('');
        expect(result.entities).to.include('');
      });

      it('should handle special characters in entity names', () => {
        const result = service.addEntity('User-Profile');
        expect(result.entities).to.include('User-Profile');
      });
    });

    describe('addDomainService', () => {
      it('should add domain service through node service and return updated config', () => {
        const result = service.addDomainService('OrderService');

        expect(result.domainServices).to.include('OrderService');
        expect(result.domainServices).to.deep.equal([
          'UserService',
          'ProductService',
          'OrderService',
        ]);
      });

      it('should preserve existing domain services when adding new ones', () => {
        const result = service.addDomainService('NewService');

        expect(result.domainServices).to.include('UserService');
        expect(result.domainServices).to.include('ProductService');
        expect(result.domainServices).to.include('NewService');
      });
    });

    describe('addApplicationService', () => {
      it('should add application service through node service and return updated config', () => {
        const result = service.addApplicationService('OrderAppService');

        expect(result.applicationServices).to.include('OrderAppService');
        expect(result.applicationServices).to.deep.equal([
          'UserAppService',
          'OrderAppService',
        ]);
      });

      it('should maintain configuration structure when adding services', () => {
        const result = service.addApplicationService('TestService');

        expect(result).to.have.property('entities');
        expect(result).to.have.property('domainServices');
        expect(result).to.have.property('applicationServices');
        expect(result).to.have.property('domainServiceConnections');
      });
    });

    describe('removeNode', () => {
      it('should remove node from all relevant collections', () => {
        const result = service.removeNode('User');

        expect(result.entities).to.not.include('User');
        expect(result.entities).to.deep.equal(['Product']);
      });

      it('should handle removal of non-existent nodes gracefully', () => {
        const result = service.removeNode('NonExistentNode');

        expect(result).to.be.an('object');
        expect(result.entities).to.deep.equal(['User', 'Product']);
      });

      it('should remove domain services correctly', () => {
        const result = service.removeNode('UserService');

        expect(result.domainServices).to.not.include('UserService');
        expect(result.domainServices).to.deep.equal(['ProductService']);
      });
    });
  });

  describe('Connection Management', () => {
    describe('addConnection', () => {
      it('should add connection and return success response with updated config', () => {
        const result = service.addConnection('UserService', 'User');

        expect(result.success).to.be.true;
        expect(result.message).to.equal('Connection added successfully');
        expect(result.data).to.not.be.null;
      });

      it('should handle connection failures gracefully', () => {
        setupFailedConnection();

        const result = service.addConnection('InvalidService', 'InvalidTarget');

        expect(result.success).to.be.false;
        expect(result.message).to.include('Connection failed');
        expect(result.data).to.be.null;
      });
    });

    describe('removeConnection', () => {
      it('should remove connection and return success response', () => {
        const result = service.removeConnection('UserService', 'User');

        expect(result.success).to.be.true;
        expect(result.message).to.equal('Connection removed successfully');
        expect(result.data).to.not.be.undefined;
      });

      it('should handle removal of non-existent connections', () => {
        setupFailedRemoveConnection();

        const result = service.removeConnection('NonExistent', 'Target');

        expect(result.success).to.be.false;
        expect(result.message).to.equal('Connection not found');
      });
    });

    describe('hasConnection', () => {
      it('should check if connection exists between source and target', () => {
        const result = service.hasConnection('UserService', 'User');
        expect(result).to.be.true;
      });

      it('should return false for non-existent connections', () => {
        setupFalseConnectionCheck();
        const result = service.hasConnection('NonExistent', 'Target');
        expect(result).to.be.false;
      });
    });

    describe('getPossibleTargets', () => {
      it('should return array of possible connection targets', () => {
        const result = service.getPossibleTargets('UserService');

        expect(result).to.be.an('array');
        expect(result).to.deep.equal(['User', 'Product']);
      });

      it('should handle nodes with no possible targets', () => {
        setupEmptyTargets();
        const result = service.getPossibleTargets('IsolatedService');

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(0);
      });
    });

    describe('getCurrentTargets', () => {
      it('should return array of current connection targets', () => {
        const result = service.getCurrentTargets('UserService');

        expect(result).to.be.an('array');
        expect(result).to.deep.equal(['User']);
      });
    });

    describe('validateConnection', () => {
      it('should validate connection between source and target', () => {
        const result = service.validateConnection('UserService', 'User');
        expect(result).to.be.true;
      });

      it('should return false for invalid connections', () => {
        setupFalseValidation();
        const result = service.validateConnection(
          'InvalidSource',
          'InvalidTarget'
        );
        expect(result).to.be.false;
      });
    });
  });

  describe('Repository Helper Methods', () => {
    describe('isRepositoryName', () => {
      it('should identify repository names correctly', () => {
        const result = service.isRepositoryName('UserRepository');
        expect(result).to.be.true;
      });

      it('should return false for non-repository names', () => {
        const result = service.isRepositoryName('UserService');
        expect(result).to.be.false;
      });
    });

    describe('isValidRepository', () => {
      it('should validate repository against entity list', () => {
        const result = service.isValidRepository('UserRepository');
        expect(result).to.be.true;
      });

      it('should return false for repositories without corresponding entities', () => {
        setupInvalidRepository();
        const result = service.isValidRepository('NonExistentRepository');
        expect(result).to.be.false;
      });
    });

    describe('getRepositories', () => {
      it('should return list of repositories based on entities', () => {
        const result = service.getRepositories();

        expect(result).to.be.an('array');
        expect(result).to.deep.equal(['UserRepository', 'ProductRepository']);
      });

      it('should handle empty entity list', () => {
        setupEmptyEntityConfig();

        const result = service.getRepositories();

        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(0);
      });
    });
  });

  describe('mapFileToConfig', () => {
    it('should parse JSON content and return OnionConfig object', () => {
      const testConfig = createMockConfig();
      const fileEntity = new FileEntity(
        '/config/onion-config.json',
        JSON.stringify(testConfig)
      );

      const result = service.mapFileToConfig(fileEntity);

      expect(result.folderPath).to.equal(testConfig.folderPath);
      expect(result.entities).to.deep.equal(testConfig.entities);
    });

    it('should handle complex configuration with nested structures', () => {
      const complexConfig = createMockConfig();
      complexConfig.domainServiceConnections = {
        UserService: ['User', 'Profile'],
        ProductService: ['Product', 'Category'],
      };

      const fileEntity = new FileEntity(
        '/config/complex-config.json',
        JSON.stringify(complexConfig)
      );
      const result = service.mapFileToConfig(fileEntity);

      expect(result.domainServiceConnections['UserService']).to.deep.equal([
        'User',
        'Profile',
      ]);
    });

    it('should throw error for invalid JSON content', () => {
      const fileEntity = new FileEntity(
        '/config/invalid-config.json',
        'invalid json content'
      );

      let errorThrown = false;
      try {
        service.mapFileToConfig(fileEntity);
      } catch (error) {
        errorThrown = true;
        expect((error as Error).message).to.include('JSON');
      }

      expect(errorThrown).to.be.true;
    });
  });

  describe('Integration Testing', () => {
    it('should maintain consistency across service calls', async () => {
      const config = await service.loadData();
      const updatedConfig = service.addEntity('Order');

      expect(updatedConfig.entities).to.include('Order');
      expect(config.domainServices).to.deep.equal([
        'UserService',
        'ProductService',
      ]);
    });

    it('should handle complex workflows with multiple operations', async () => {
      await service.loadData();

      const configWithEntity = service.addEntity('Order');
      const configWithDomain = service.addDomainService('OrderService');
      const configWithApp = service.addApplicationService('OrderAppService');
      const connectionResult = service.addConnection('OrderService', 'Order');
      const repositories = service.getRepositories();

      expect(configWithEntity.entities).to.include('Order');
      expect(configWithDomain.domainServices).to.include('OrderService');
      expect(configWithApp.applicationServices).to.include('OrderAppService');
      expect(connectionResult.success).to.be.true;
      expect(repositories).to.be.an('array');
    });
  });

  describe('Error Handling', () => {
    it('should handle state service failures gracefully', async () => {
      setupFailedStateService();

      let errorCaught = false;
      try {
        await service.loadData();
      } catch (error) {
        errorCaught = true;
        expect((error as Error).message).to.equal('State service failed');
      }

      expect(errorCaught).to.be.true;
    });

    it('should handle node service failures appropriately', () => {
      setupFailedNodeService();

      let errorThrown = false;
      try {
        service.addEntity('TestEntity');
      } catch (error) {
        errorThrown = true;
        expect((error as Error).message).to.equal('Node service failed');
      }

      expect(errorThrown).to.be.true;
    });
  });
});
