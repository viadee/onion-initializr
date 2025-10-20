import { expect } from 'chai';
import { OnionConfigValidationService } from '../../../Domain/Services/OnionConfigValidationService';
import { OnionConfigService } from '../../../Domain/Services/OnionConfigService';
import { OnionConfig } from '../../../Domain/Entities/OnionConfig';
import { FileEntity } from '../../../Domain/Entities/FileEntity';
import { DiFramework } from '../../../Domain/Entities/DiFramework';
import { UIFrameworks } from '../../../Domain/Entities/UiFramework';

describe('OnionConfigValidationService', () => {
  let validationService: OnionConfigValidationService;
  let mockOnionConfigService: OnionConfigService;
  let callLog: { method: string; args: unknown[] }[];

  beforeEach(() => {
    callLog = [];

    // Create mock OnionConfigService
    mockOnionConfigService = {
      mapFileToConfig: (file: FileEntity) => {
        callLog.push({ method: 'mapFileToConfig', args: [file] });
        try {
          return JSON.parse(file.content);
        } catch {
          throw new Error('Invalid JSON');
        }
      },
    } as unknown as OnionConfigService;

    validationService = new OnionConfigValidationService(
      mockOnionConfigService
    );
  });

  describe('isUserConfigValid', () => {
    it('should return true for valid configuration', async () => {
      const validConfig = {
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
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      };

      const file = new FileEntity('config.json', JSON.stringify(validConfig));
      const result = await validationService.isUserConfigValid(file);

      expect(result).to.be.true;
      expect(callLog).to.deep.include({
        method: 'mapFileToConfig',
        args: [file],
      });
    });

    it('should throw error for invalid configuration', async () => {
      const invalidConfig = {
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['NonExistentEntity'], // Invalid entity
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService'],
            repositories: ['IUserRepository'],
          },
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      };

      const file = new FileEntity('config.json', JSON.stringify(invalidConfig));

      try {
        await validationService.isUserConfigValid(file);
        expect.fail('Should have thrown error');
      } catch (e) {
        expect((e as Error).message).to.include(
          'Invalid dependency "NonExistentEntity"'
        );
      }
    });

    it('should handle JSON parsing errors', async () => {
      const file = new FileEntity('config.json', 'invalid json {');

      try {
        await validationService.isUserConfigValid(file);
        expect.fail('Should have thrown error');
      } catch (e) {
        expect((e as Error).message).to.equal('Invalid JSON');
      }
    });
  });

  describe('validateConfigStructure', () => {
    it('should return valid true for complete valid configuration', () => {
      const config = new OnionConfig({
        entities: ['User', 'Product'],
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
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should return validation errors for invalid configuration', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['NonExistentEntity'],
          UnknownService: ['User'], // Unknown service
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['NonExistentDomainService'],
            repositories: ['InvalidRepository'],
          },
          UnknownAppService: {
            // Unknown app service
            domainServices: ['UserService'],
            repositories: ['IUserRepository'],
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiFramework: 'invalid' as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diFramework: 'invalid' as any,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.have.length.greaterThan(0);
      expect(result.errors.join(' ')).to.include(
        'Invalid dependency "NonExistentEntity"'
      );
      expect(result.errors.join(' ')).to.include(
        'Unknown domainService "UnknownService"'
      );
      expect(result.errors.join(' ')).to.include(
        'Invalid domainService "NonExistentDomainService"'
      );
      expect(result.errors.join(' ')).to.include(
        'Invalid repository "InvalidRepository"'
      );
      expect(result.errors.join(' ')).to.include(
        'Unknown applicationService "UnknownAppService"'
      );
      expect(result.errors.join(' ')).to.include(
        'Unknown UI framework "invalid"'
      );
      expect(result.errors.join(' ')).to.include(
        'Unknown DI framework "invalid"'
      );
    });

    it('should handle empty or missing arrays', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });
  });

  describe('Domain Service Validation', () => {
    it('should validate domain services with correct entity dependencies', () => {
      const config = new OnionConfig({
        entities: ['User', 'Product'],
        domainServices: ['UserService', 'ProductService'],
        applicationServices: [],
        domainServiceConnections: {
          UserService: ['User'],
          ProductService: ['Product', 'User'],
        },
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should reject domain services with invalid entity dependencies', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: [],
        domainServiceConnections: {
          UserService: ['User', 'NonExistentEntity'],
        },
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Invalid dependency "NonExistentEntity" in domainService "UserService". Not found in entities.'
      );
    });

    it('should reject unknown domain services in connections', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: [],
        domainServiceConnections: {
          UserService: ['User'],
          UnknownService: ['User'],
        },
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Unknown domainService "UnknownService" found in domainServiceConnections.'
      );
    });

    it('should handle non-array domainServices', () => {
      const config = new OnionConfig({
        entities: ['User'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        domainServices: 'invalid' as any,
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include('`domainServices` should be an array.');
    });

    it('should handle missing dependency arrays for domain services', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: [],
        domainServiceConnections: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          UserService: 'invalid' as any,
        },
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Missing or invalid dependency array for domainService "UserService". Expected an array.'
      );
    });
  });

  describe('Application Service Validation', () => {
    it('should validate application services with correct dependencies', () => {
      const config = new OnionConfig({
        entities: ['User', 'Product'],
        domainServices: ['UserService', 'ProductService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
          ProductService: ['Product'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService', 'ProductService'],
            repositories: ['IUserRepository', 'IProductRepository'],
          },
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should reject application services with invalid domain service dependencies', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService', 'NonExistentDomainService'],
            repositories: ['IUserRepository'],
          },
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Invalid domainService "NonExistentDomainService" in applicationService "UserAppService". Not found in domainServices.'
      );
    });

    it('should reject application services with invalid repository dependencies', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService'],
            repositories: [
              'IUserRepository',
              'InvalidRepository',
              'INonExistentEntityRepository',
            ],
          },
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Invalid repository "InvalidRepository" in applicationService "UserAppService". Expected format: I<Entity>Repository where Entity exists in entities.'
      );
      expect(result.errors).to.include(
        'Invalid repository "INonExistentEntityRepository" in applicationService "UserAppService". Expected format: I<Entity>Repository where Entity exists in entities.'
      );
    });

    it('should handle non-array applicationServices', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServices: 'invalid' as any,
        domainServiceConnections: { UserService: ['User'] },
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        '`applicationServices` should be an array.'
      );
    });

    it('should handle missing dependency definitions for application services', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
        },
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Missing dependency definition for applicationService "UserAppService" in applicationServiceDependencies.'
      );
    });

    it('should handle invalid dependency structure for application services', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
        },
        applicationServiceDependencies: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          UserAppService: 'invalid' as any,
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Missing or invalid dependencies for applicationService "UserAppService".'
      );
    });

    it('should handle missing domainServices array in dependencies', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            repositories: ['IUserRepository'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Missing "domainServices" array for applicationService "UserAppService".'
      );
    });

    it('should handle missing repositories array in dependencies', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Missing "repositories" array for applicationService "UserAppService".'
      );
    });

    it('should handle unknown application services in dependencies', () => {
      const config = new OnionConfig({
        entities: ['User'],
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
          UnknownAppService: {
            domainServices: ['UserService'],
            repositories: ['IUserRepository'],
          },
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Unknown applicationService "UnknownAppService" found in applicationServiceDependencies.'
      );
    });
  });

  describe('UI Framework Validation', () => {
    it('should accept valid UI frameworks', () => {
      const validFrameworks: (keyof UIFrameworks)[] = [
        'angular',
        'react',
        'vue',
        'lit',
      ];

      validFrameworks.forEach(framework => {
        const config = new OnionConfig({
          entities: [],
          domainServices: [],
          applicationServices: [],
          domainServiceConnections: {},
          applicationServiceDependencies: {},
          uiFramework: framework,
          diFramework: 'angular' as DiFramework,
        });

        const result = validationService.validateConfigStructure(config);
        expect(result.valid).to.be.true;
      });
    });

    it('should reject invalid UI frameworks', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiFramework: 'invalid' as any,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Unknown UI framework "invalid" found in config. Valid frameworks are: react, angular, vue, lit, vanilla.'
      );
    });

    it('should reject missing UI framework', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiFramework: undefined as any,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include('`uiFramework` is required.');
    });

    it('should reject non-string UI framework', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiFramework: 123 as any,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include('`uiFramework` should be a string.');
    });
  });

  describe('DI Framework Validation', () => {
    it('should accept valid DI frameworks', () => {
      const validFrameworks: DiFramework[] = ['angular', 'awilix'];

      validFrameworks.forEach(framework => {
        const config = new OnionConfig({
          entities: [],
          domainServices: [],
          applicationServices: [],
          domainServiceConnections: {},
          applicationServiceDependencies: {},
          uiFramework: 'angular' as keyof UIFrameworks,
          diFramework: framework,
        });

        const result = validationService.validateConfigStructure(config);
        expect(result.valid).to.be.true;
      });
    });

    it('should reject invalid DI frameworks', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diFramework: 'invalid' as any,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include(
        'Unknown DI framework "invalid" found in config. Valid frameworks are: awilix, angular.'
      );
    });

    it('should reject missing DI framework', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
      });
      // Force diFramework to be undefined to test validation
      config.diFramework = undefined;

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include('`diFramework` is required.');
    });

    it('should reject non-string DI framework', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diFramework: 123 as any,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.include('`diFramework` should be a string.');
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should validate complex real-world configuration', () => {
      const config = new OnionConfig({
        entities: ['User', 'Product', 'Order', 'Category'],
        domainServices: [
          'UserService',
          'ProductService',
          'OrderService',
          'CategoryService',
        ],
        applicationServices: [
          'UserAppService',
          'ProductAppService',
          'OrderAppService',
        ],
        domainServiceConnections: {
          UserService: ['User'],
          ProductService: ['Product', 'Category'],
          OrderService: ['Order', 'User', 'Product'],
          CategoryService: ['Category'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService'],
            repositories: ['IUserRepository'],
          },
          ProductAppService: {
            domainServices: ['ProductService', 'CategoryService'],
            repositories: ['IProductRepository', 'ICategoryRepository'],
          },
          OrderAppService: {
            domainServices: ['OrderService', 'UserService', 'ProductService'],
            repositories: [
              'IOrderRepository',
              'IUserRepository',
              'IProductRepository',
            ],
          },
        },
        uiFramework: 'react' as keyof UIFrameworks,
        diFramework: 'awilix' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should accumulate multiple validation errors', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['NonExistentEntity'], // Error 1
          UnknownService: ['User'], // Error 2
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['NonExistentDomainService'], // Error 3
            repositories: ['InvalidRepository'], // Error 4
          },
          UnknownAppService: {
            // Error 5
            domainServices: ['UserService'],
            repositories: ['IUserRepository'],
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiFramework: 'invalidUI' as any, // Error 6
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        diFramework: 'invalidDI' as any, // Error 7
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.have.length(7);
    });

    it('should handle edge cases with empty arrays and null values', () => {
      const config = new OnionConfig({
        entities: [],
        domainServices: [],
        applicationServices: [],
        domainServiceConnections: {},
        applicationServiceDependencies: {},
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should handle repository naming edge cases', () => {
      const config = new OnionConfig({
        entities: ['User', 'ProductCategory'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['User'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['UserService'],
            repositories: [
              'IUserRepository', // Valid
              'IProductCategoryRepository', // Valid
              'UserRepository', // Invalid - missing I prefix
              'IRepository', // Invalid - missing entity name
              'IUserRepo', // Invalid - wrong suffix
              'IProductRepository', // Invalid - entity doesn't exist
            ],
          },
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors).to.have.length(4);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed configuration gracefully', () => {
      // Test with null values and missing properties
      const malformedConfig = {
        entities: null,
        domainServices: undefined,
        applicationServices: 'not-an-array',
        domainServiceConnections: null,
        applicationServiceDependencies: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      const result = validationService.validateConfigStructure(malformedConfig);

      expect(result.valid).to.be.false;
      expect(result.errors.length).to.be.greaterThan(0);
    });

    it('should provide clear error messages for different validation failures', () => {
      const config = new OnionConfig({
        entities: ['User'],
        domainServices: ['UserService'],
        applicationServices: ['UserAppService'],
        domainServiceConnections: {
          UserService: ['InvalidEntity'],
        },
        applicationServiceDependencies: {
          UserAppService: {
            domainServices: ['InvalidDomainService'],
            repositories: ['InvalidRepo'],
          },
        },
        uiFramework: 'angular' as keyof UIFrameworks,
        diFramework: 'angular' as DiFramework,
      });

      const result = validationService.validateConfigStructure(config);

      expect(result.valid).to.be.false;
      expect(result.errors[0]).to.include('Invalid dependency "InvalidEntity"');
      expect(result.errors[1]).to.include(
        'Invalid domainService "InvalidDomainService"'
      );
      expect(result.errors[2]).to.include('Invalid repository "InvalidRepo"');
    });
  });
});
