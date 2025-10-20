import { expect } from 'chai';
import { OnionConfigStateService } from '../../../Domain/Services/OnionConfigStateService';
import { OnionConfig } from '../../../Domain/Entities/OnionConfig';
import { IOnionConfigRepository } from '../../../Domain/Interfaces/IOnionConfigRepository';

describe('OnionConfigStateService', () => {
  let stateService: OnionConfigStateService;
  let mockConfig: OnionConfig;
  let mockRepository: Partial<IOnionConfigRepository>;

  // Helper function to create mock configuration
  const createMockConfig = (): OnionConfig => ({
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
        repositories: ['IUserRepository'],
      },
    },
    uiFramework: 'react',
    diFramework: 'awilix',
  });

  beforeEach(() => {
    mockConfig = createMockConfig();

    mockRepository = {
      save: async () => {},
      loadInitialData: async () => mockConfig,
    };

    stateService = new OnionConfigStateService(
      mockRepository as IOnionConfigRepository
    );

    // Initialize the service with test data
    stateService.updateData(() => mockConfig);
  });

  describe('constructor', () => {
    it('should create a new instance with empty initial data', () => {
      const newService = new OnionConfigStateService(
        mockRepository as IOnionConfigRepository
      );
      const initialData = newService.getData();

      expect(initialData).to.be.an('object');
      expect(initialData.folderPath).to.equal('');
      expect(initialData.entities).to.be.an('array').that.is.empty;
      expect(initialData.domainServices).to.be.an('array').that.is.empty;
      expect(initialData.applicationServices).to.be.an('array').that.is.empty;
    });

    it('should initialize with default framework values', () => {
      const newService = new OnionConfigStateService(
        mockRepository as IOnionConfigRepository
      );
      const initialData = newService.getData();

      expect(initialData.uiFramework).to.be.a('string');
      expect(initialData.diFramework).to.be.a('string');
    });

    it('should initialize with empty connections and dependencies', () => {
      const newService = new OnionConfigStateService(
        mockRepository as IOnionConfigRepository
      );
      const initialData = newService.getData();

      expect(initialData.domainServiceConnections).to.be.an('object').that.is
        .empty;
      expect(initialData.applicationServiceDependencies).to.be.an('object').that
        .is.empty;
    });
  });

  describe('getData', () => {
    it('should return current configuration data', () => {
      const data = stateService.getData();

      expect(data).to.deep.equal(mockConfig);
    });

    it('should return consistent data across multiple calls', () => {
      const data1 = stateService.getData();
      const data2 = stateService.getData();
      const data3 = stateService.getData();

      expect(data1).to.deep.equal(data2);
      expect(data2).to.deep.equal(data3);
    });

    it('should preserve all configuration properties', () => {
      const data = stateService.getData();

      expect(data).to.have.property('folderPath');
      expect(data).to.have.property('entities');
      expect(data).to.have.property('domainServices');
      expect(data).to.have.property('applicationServices');
      expect(data).to.have.property('domainServiceConnections');
      expect(data).to.have.property('applicationServiceDependencies');
      expect(data).to.have.property('uiFramework');
      expect(data).to.have.property('diFramework');
    });

    it('should return arrays as arrays', () => {
      const data = stateService.getData();

      expect(data.entities).to.be.an('array');
      expect(data.domainServices).to.be.an('array');
      expect(data.applicationServices).to.be.an('array');
    });

    it('should return objects as objects', () => {
      const data = stateService.getData();

      expect(data.domainServiceConnections).to.be.an('object');
      expect(data.applicationServiceDependencies).to.be.an('object');
    });
  });

  describe('updateData', () => {
    it('should update configuration using updater function', () => {
      const newFolderPath = '/updated/project';

      const result = stateService.updateData(config => ({
        ...config,
        folderPath: newFolderPath,
      }));

      expect(result.folderPath).to.equal(newFolderPath);
      expect(stateService.getData().folderPath).to.equal(newFolderPath);
    });

    it('should return the updated configuration', () => {
      const newEntity = 'Order';

      const result = stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, newEntity],
      }));

      expect(result.entities).to.include(newEntity);
      expect(result.entities).to.have.lengthOf(3);
    });

    it('should preserve unchanged properties', () => {
      const originalDomainServices = [...mockConfig.domainServices];

      stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, 'NewEntity'],
      }));

      const updatedData = stateService.getData();
      expect(updatedData.domainServices).to.deep.equal(originalDomainServices);
    });

    it('should handle complex updates', () => {
      const result = stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, 'Order'],
        domainServices: [...config.domainServices, 'OrderService'],
        domainServiceConnections: {
          ...config.domainServiceConnections,
          OrderService: ['Order'],
        },
      }));

      expect(result.entities).to.include('Order');
      expect(result.domainServices).to.include('OrderService');
      expect(result.domainServiceConnections).to.have.property('OrderService');
      expect(result.domainServiceConnections['OrderService']).to.deep.equal([
        'Order',
      ]);
    });

    it('should handle replacing entire arrays', () => {
      const newEntities = ['NewEntity1', 'NewEntity2'];

      const result = stateService.updateData(config => ({
        ...config,
        entities: newEntities,
      }));

      expect(result.entities).to.deep.equal(newEntities);
      expect(result.entities).to.not.include('User');
      expect(result.entities).to.not.include('Product');
    });

    it('should handle replacing entire objects', () => {
      const newConnections = {
        NewService: ['NewEntity'],
      };

      const result = stateService.updateData(config => ({
        ...config,
        domainServiceConnections: newConnections,
      }));

      expect(result.domainServiceConnections).to.deep.equal(newConnections);
      expect(result.domainServiceConnections).to.not.have.property(
        'UserService'
      );
    });

    it('should allow complete configuration replacement', () => {
      const newConfig: OnionConfig = {
        folderPath: '/completely/new/path',
        entities: ['NewEntity'],
        domainServices: ['NewService'],
        applicationServices: ['NewAppService'],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'vue',
        diFramework: 'angular',
      };

      const result = stateService.updateData(() => newConfig);

      expect(result).to.deep.equal(newConfig);
      expect(stateService.getData()).to.deep.equal(newConfig);
    });

    it('should handle updater function that returns the same config', () => {
      const originalData = stateService.getData();

      const result = stateService.updateData(config => config);

      expect(result).to.deep.equal(originalData);
      expect(stateService.getData()).to.deep.equal(originalData);
    });

    it('should handle sequential updates', () => {
      stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, 'Entity1'],
      }));

      stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, 'Entity2'],
      }));

      const finalData = stateService.getData();
      expect(finalData.entities).to.include('Entity1');
      expect(finalData.entities).to.include('Entity2');
      expect(finalData.entities).to.have.lengthOf(4); // Original 2 + 2 new
    });

    it('should handle multiple property updates in one call', () => {
      const result = stateService.updateData(config => ({
        ...config,
        folderPath: '/new/path',
        entities: [...config.entities, 'NewEntity'],
        uiFramework: 'angular',
        diFramework: 'angular',
      }));

      expect(result.folderPath).to.equal('/new/path');
      expect(result.entities).to.include('NewEntity');
      expect(result.uiFramework).to.equal('angular');
      expect(result.diFramework).to.equal('angular');
    });
  });

  describe('data persistence and state management', () => {
    it('should maintain state between operations', () => {
      stateService.updateData(config => ({
        ...config,
        folderPath: '/persistent/path',
      }));

      const dataAfterUpdate = stateService.getData();
      expect(dataAfterUpdate.folderPath).to.equal('/persistent/path');

      // Another operation
      stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, 'PersistentEntity'],
      }));

      const finalData = stateService.getData();
      expect(finalData.folderPath).to.equal('/persistent/path'); // Still there
      expect(finalData.entities).to.include('PersistentEntity');
    });

    it('should handle rapid successive updates', () => {
      for (let i = 0; i < 5; i++) {
        stateService.updateData(config => ({
          ...config,
          entities: [...config.entities, `Entity${i}`],
        }));
      }

      const finalData = stateService.getData();
      expect(finalData.entities).to.have.lengthOf(7); // Original 2 + 5 new
      for (let i = 0; i < 5; i++) {
        expect(finalData.entities).to.include(`Entity${i}`);
      }
    });

    it('should handle large data structures', () => {
      const largeEntityArray = Array.from(
        { length: 100 },
        (_, i) => `Entity${i}`
      );

      const result = stateService.updateData(config => ({
        ...config,
        entities: largeEntityArray,
      }));

      expect(result.entities).to.have.lengthOf(100);
      expect(result.entities[0]).to.equal('Entity0');
      expect(result.entities[99]).to.equal('Entity99');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle updater function that throws error', () => {
      const originalData = stateService.getData();

      expect(() => {
        stateService.updateData(() => {
          throw new Error('Updater error');
        });
      }).to.throw('Updater error');

      // State should remain unchanged after error
      expect(stateService.getData()).to.deep.equal(originalData);
    });

    it('should handle updater function returning null', () => {
      expect(() => {
        stateService.updateData(() => null as unknown as OnionConfig);
      }).to.not.throw();
    });

    it('should handle updater function returning undefined', () => {
      expect(() => {
        stateService.updateData(() => undefined as unknown as OnionConfig);
      }).to.not.throw();
    });

    it('should handle malformed configuration objects', () => {
      const malformedConfig = {
        folderPath: '/test',
        entities: null,
        domainServices: undefined,
        // Missing other required properties
      } as unknown as OnionConfig;

      expect(() => {
        stateService.updateData(() => malformedConfig);
      }).to.not.throw();
    });
  });

  describe('immutability and data isolation', () => {
    it('should maintain immutability across updates', () => {
      const beforeUpdate = stateService.getData();

      stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, 'NewEntity'],
      }));

      const afterUpdate = stateService.getData();

      // Original reference should be unchanged
      expect(beforeUpdate.entities).to.not.include('NewEntity');
      expect(afterUpdate.entities).to.include('NewEntity');
    });

    it('should create new array references on update', () => {
      const beforeEntities = stateService.getData().entities;

      stateService.updateData(config => ({
        ...config,
        entities: [...config.entities, 'NewEntity'],
      }));

      const afterEntities = stateService.getData().entities;

      expect(beforeEntities).to.not.equal(afterEntities); // Different references
    });

    it('should create new object references on update', () => {
      const beforeConnections = stateService.getData().domainServiceConnections;

      stateService.updateData(config => ({
        ...config,
        domainServiceConnections: {
          ...config.domainServiceConnections,
          NewService: ['NewEntity'],
        },
      }));

      const afterConnections = stateService.getData().domainServiceConnections;

      expect(beforeConnections).to.not.equal(afterConnections); // Different references
    });
  });
});
