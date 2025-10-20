import { expect } from 'chai';
import { OnionConfigRepositoryService } from '../../../domain/services/OnionConfigRepositoryService';
import { OnionConfig } from '../../../domain/entities/OnionConfig';

describe('OnionConfigRepositoryService', () => {
  let repositoryService: OnionConfigRepositoryService;
  let mockConfig: OnionConfig;

  // Helper function to create mock configuration
  const createMockConfig = (): OnionConfig => ({
    folderPath: '/test/project',
    entities: ['User', 'Product', 'Order'],
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
    repositoryService = new OnionConfigRepositoryService();
  });

  describe('isRepositoryName', () => {
    it('should return true for valid repository names', () => {
      expect(repositoryService.isRepositoryName('IUserRepository')).to.be.true;
      expect(repositoryService.isRepositoryName('IProductRepository')).to.be
        .true;
      expect(repositoryService.isRepositoryName('IOrderRepository')).to.be.true;
    });

    it('should return false for repository names without I prefix', () => {
      expect(repositoryService.isRepositoryName('UserRepository')).to.be.false;
      expect(repositoryService.isRepositoryName('ProductRepository')).to.be
        .false;
    });

    it('should return false for empty repository names', () => {
      expect(repositoryService.isRepositoryName('')).to.be.false;
    });

    it('should return false for repository names without Repository suffix', () => {
      expect(repositoryService.isRepositoryName('User')).to.be.false;
      expect(repositoryService.isRepositoryName('IUser')).to.be.false;
      expect(repositoryService.isRepositoryName('UserService')).to.be.false;
    });

    it('should return false for null or undefined', () => {
      expect(repositoryService.isRepositoryName(null as unknown as string)).to
        .be.false;
      expect(repositoryService.isRepositoryName(undefined as unknown as string))
        .to.be.false;
    });

    it('should handle special characters in repository names', () => {
      expect(repositoryService.isRepositoryName('IUser123Repository')).to.be
        .true;
      expect(repositoryService.isRepositoryName('IUserProfileRepository')).to.be
        .true;
    });

    it('should be case sensitive for I prefix', () => {
      expect(repositoryService.isRepositoryName('iUserRepository')).to.be.false;
      expect(repositoryService.isRepositoryName('userRepository')).to.be.false;
    });

    it('should handle edge cases', () => {
      expect(repositoryService.isRepositoryName('IRepository')).to.be.false;
      expect(repositoryService.isRepositoryName('I1Repository')).to.be.false;
      expect(repositoryService.isRepositoryName('I_Repository')).to.be.false;
    });
  });

  describe('isValidRepository', () => {
    it('should return true when repository matches existing entity', () => {
      const entities = ['User', 'Product', 'Order'];

      expect(repositoryService.isValidRepository('IUserRepository', entities))
        .to.be.true;
      expect(
        repositoryService.isValidRepository('IProductRepository', entities)
      ).to.be.true;
      expect(repositoryService.isValidRepository('IOrderRepository', entities))
        .to.be.true;
    });

    it('should return false when repository does not match any entity', () => {
      const entities = ['User', 'Product'];

      expect(repositoryService.isValidRepository('IOrderRepository', entities))
        .to.be.false;
      expect(
        repositoryService.isValidRepository('ICustomerRepository', entities)
      ).to.be.false;
    });

    it('should return false for invalid repository names', () => {
      const entities = ['User', 'Product'];

      expect(repositoryService.isValidRepository('User', entities)).to.be.false;
      expect(repositoryService.isValidRepository('UserRepository', entities)).to
        .be.false;
      expect(repositoryService.isValidRepository('IUser', entities)).to.be
        .false;
    });

    it('should handle empty entities array', () => {
      expect(repositoryService.isValidRepository('IUserRepository', [])).to.be
        .false;
    });

    it('should handle null or undefined entities array', () => {
      expect(
        repositoryService.isValidRepository(
          'IUserRepository',
          null as unknown as string[]
        )
      ).to.be.false;
      expect(
        repositoryService.isValidRepository(
          'IUserRepository',
          undefined as unknown as string[]
        )
      ).to.be.false;
    });

    it('should be case sensitive for entity matching', () => {
      const entities = ['User', 'product'];

      expect(repositoryService.isValidRepository('IUserRepository', entities))
        .to.be.true;
      expect(
        repositoryService.isValidRepository('IProductRepository', entities)
      ).to.be.false; // Product not in entities array
      expect(
        repositoryService.isValidRepository('IproductRepository', entities)
      ).to.be.false; // Invalid format - entity name must start with capital letter
    });

    it('should handle complex entity names', () => {
      const entities = ['UserProfile', 'ProductInfo', 'OrderHistory'];

      expect(
        repositoryService.isValidRepository('IUserProfileRepository', entities)
      ).to.be.true;
      expect(
        repositoryService.isValidRepository('IProductInfoRepository', entities)
      ).to.be.true;
      expect(
        repositoryService.isValidRepository('IOrderHistoryRepository', entities)
      ).to.be.true;
    });
  });

  describe('getRepositories', () => {
    it('should generate repository names for given entities', () => {
      const entities = ['User', 'Product', 'Order'];
      const repositories = repositoryService.getRepositories(entities);

      expect(repositories).to.deep.equal([
        'IUserRepository',
        'IProductRepository',
        'IOrderRepository',
      ]);
    });

    it('should handle empty entities array', () => {
      const repositories = repositoryService.getRepositories([]);

      expect(repositories).to.deep.equal([]);
    });

    it('should handle null or undefined entities array', () => {
      const repositoriesForNull = repositoryService.getRepositories(
        null as unknown as string[]
      );
      const repositoriesForUndefined = repositoryService.getRepositories(
        undefined as unknown as string[]
      );

      expect(repositoriesForNull).to.deep.equal([]);
      expect(repositoriesForUndefined).to.deep.equal([]);
    });

    it('should handle entities with special characters', () => {
      const entities = ['User123', 'ProductInfo', 'OrderHistory'];
      const repositories = repositoryService.getRepositories(entities);

      expect(repositories).to.deep.equal([
        'IUser123Repository',
        'IProductInfoRepository',
        'IOrderHistoryRepository',
      ]);
    });

    it('should maintain order of entities', () => {
      const entities = ['Order', 'User', 'Product'];
      const repositories = repositoryService.getRepositories(entities);

      expect(repositories).to.deep.equal([
        'IOrderRepository',
        'IUserRepository',
        'IProductRepository',
      ]);
    });

    it('should handle duplicate entities', () => {
      const entities = ['User', 'User', 'Product'];
      const repositories = repositoryService.getRepositories(entities);

      expect(repositories).to.deep.equal([
        'IUserRepository',
        'IUserRepository',
        'IProductRepository',
      ]);
    });

    it('should handle empty string entities', () => {
      const entities = ['User', '', 'Product'];
      const repositories = repositoryService.getRepositories(entities);

      expect(repositories).to.deep.equal([
        'IUserRepository',
        'IRepository',
        'IProductRepository',
      ]);
    });
  });

  describe('getRing', () => {
    it('should return correct ring for entities', () => {
      const userRing = repositoryService.getRing('User', mockConfig);
      expect(userRing?.value).to.equal('Entities');

      const productRing = repositoryService.getRing('Product', mockConfig);
      expect(productRing?.value).to.equal('Entities');
    });

    it('should return correct ring for domain services', () => {
      const userServiceRing = repositoryService.getRing(
        'UserService',
        mockConfig
      );
      expect(userServiceRing?.value).to.equal('Domain Services');

      const productServiceRing = repositoryService.getRing(
        'ProductService',
        mockConfig
      );
      expect(productServiceRing?.value).to.equal('Domain Services');
    });

    it('should return correct ring for application services', () => {
      const userAppServiceRing = repositoryService.getRing(
        'UserAppService',
        mockConfig
      );
      expect(userAppServiceRing?.value).to.equal('Application Services');
    });

    it('should return correct ring for repositories', () => {
      const userRepoRing = repositoryService.getRing(
        'IUserRepository',
        mockConfig
      );
      expect(userRepoRing?.value).to.equal('Repositories');
    });

    it('should handle unknown nodes', () => {
      const unknownRing = repositoryService.getRing('UnknownNode', mockConfig);
      expect(unknownRing).to.be.null;
    });

    it('should handle empty node name', () => {
      const emptyRing = repositoryService.getRing('', mockConfig);
      expect(emptyRing).to.be.null;
    });

    it('should handle null or undefined node', () => {
      const nullRing = repositoryService.getRing(
        null as unknown as string,
        mockConfig
      );
      expect(nullRing).to.be.null;

      const undefinedRing = repositoryService.getRing(
        undefined as unknown as string,
        mockConfig
      );
      expect(undefinedRing).to.be.null;
    });

    it('should handle malformed config', () => {
      const malformedConfig = {
        entities: null,
        domainServices: undefined,
        applicationServices: [],
      } as unknown as OnionConfig;

      const ring = repositoryService.getRing('User', malformedConfig);
      expect(ring).to.be.null;
    });

    it('should correctly identify repository ring for valid repositories', () => {
      // Test that repositories are correctly identified as Repositories
      expect(
        repositoryService.getRing('IProductRepository', mockConfig)?.value
      ).to.equal('Repositories');
      expect(
        repositoryService.getRing('IOrderRepository', mockConfig)?.value
      ).to.equal('Repositories');
    });

    it('should handle edge case repository names', () => {
      // Test invalid repository format
      expect(repositoryService.getRing('UserRepository', mockConfig)).to.be
        .null;
      expect(repositoryService.getRing('IUser', mockConfig)).to.be.null;
    });
  });

  describe('integration and edge cases', () => {
    it('should handle complex configurations', () => {
      const complexConfig: OnionConfig = {
        folderPath: '/complex/project',
        entities: ['User', 'Product', 'Order', 'Customer', 'Payment'],
        domainServices: ['UserService', 'ProductService', 'OrderService'],
        applicationServices: ['UserAppService', 'OrderAppService'],
        domainServiceConnections: {
          UserService: ['User', 'Customer'],
          ProductService: ['Product'],
          OrderService: ['Order', 'User', 'Product'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService'],
            repositories: ['IUserRepository', 'ICustomerRepository'],
          },
          OrderAppService: {
            domainServices: ['OrderService', 'ProductService'],
            repositories: [
              'IOrderRepository',
              'IUserRepository',
              'IProductRepository',
            ],
          },
        },
        uiFramework: 'react',
        diFramework: 'awilix',
      };

      // Test repository generation
      const allRepositories = repositoryService.getRepositories(
        complexConfig.entities
      );
      expect(allRepositories).to.have.lengthOf(5);

      // Test validation
      expect(
        repositoryService.isValidRepository(
          'IUserRepository',
          complexConfig.entities
        )
      ).to.be.true;
      expect(
        repositoryService.isValidRepository(
          'IPaymentRepository',
          complexConfig.entities
        )
      ).to.be.true;
      expect(
        repositoryService.isValidRepository(
          'IInvalidRepository',
          complexConfig.entities
        )
      ).to.be.false;

      // Test ring determination
      expect(
        repositoryService.getRing('Payment', complexConfig)?.value
      ).to.equal('Entities');
      expect(
        repositoryService.getRing('OrderService', complexConfig)?.value
      ).to.equal('Domain Services');
      expect(
        repositoryService.getRing('OrderAppService', complexConfig)?.value
      ).to.equal('Application Services');
      expect(
        repositoryService.getRing('IPaymentRepository', complexConfig)?.value
      ).to.equal('Repositories');
    });

    it('should be consistent across multiple calls', () => {
      const entities = ['User', 'Product'];

      const repo1 = repositoryService.getRepositories(entities);
      const repo2 = repositoryService.getRepositories(entities);

      expect(repo1).to.deep.equal(repo2);

      const valid1 = repositoryService.isValidRepository(
        'IUserRepository',
        entities
      );
      const valid2 = repositoryService.isValidRepository(
        'IUserRepository',
        entities
      );

      expect(valid1).to.equal(valid2);
    });

    it('should handle performance with large datasets', () => {
      const largeEntities = Array.from({ length: 100 }, (_, i) => `Entity${i}`);

      const repositories = repositoryService.getRepositories(largeEntities);
      expect(repositories).to.have.lengthOf(100);

      const isValid = repositoryService.isValidRepository(
        'IEntity50Repository',
        largeEntities
      );
      expect(isValid).to.be.true;
    });
  });
});
