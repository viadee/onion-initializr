import { expect } from 'chai';
import { AwilixConfigService } from '../../../domain/services/AwilixConfigService';
import { AwilixConfig } from '../../../domain/entities/AwilixConfig';
import { FileEntity } from '../../../domain/entities/FileEntity';

describe('AwilixConfigService', () => {
  let service: AwilixConfigService;

  beforeEach(() => {
    service = new AwilixConfigService();
  });

  describe('generateAwilixConfigFile', () => {
    describe('when generating configuration with basic inputs', () => {
      it('should generate awilix config file with single entity', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        expect(result).to.be.instanceOf(FileEntity);
        expect(result.filePath).to.equal(configPath);

        const content = result.content;
        expect(content).to.include(
          'import { createContainer, asClass, InjectionMode } from "awilix"'
        );
        expect(content).to.include(
          'import { User } from "../../domain/entities/User"'
        );
        expect(content).to.include(
          'import { UserRepository } from "../../infrastructure/repositories/UserRepository"'
        );
        expect(content).to.include('user: asClass(User).singleton()');
        expect(content).to.include(
          'userRepository: asClass(UserRepository).singleton()'
        );
      });

      it('should generate awilix config file with single domain service', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          [],
          ['UserService'],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        expect(result).to.be.instanceOf(FileEntity);
        expect(result.filePath).to.equal(configPath);

        const content = result.content;
        expect(content).to.include(
          'import { UserService } from "../../domain/services/UserService"'
        );
        expect(content).to.include(
          'userService: asClass(UserService).singleton()'
        );
      });

      it('should generate awilix config file with single application service', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          [],
          [],
          ['UserAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        expect(result).to.be.instanceOf(FileEntity);
        expect(result.filePath).to.equal(configPath);
        const content = result.content;
        expect(content).to.include(
          'import { UserAppService } from "../../application/services/UserAppService"'
        );
        expect(content).to.include(
          'userAppService: asClass(UserAppService).singleton()'
        );
      });
    });

    describe('when generating configuration with multiple services', () => {
      it('should generate config with multiple entities', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User', 'Product', 'Order'],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check entity imports
        expect(content).to.include(
          'import { User } from "../../domain/entities/User"'
        );
        expect(content).to.include(
          'import { Product } from "../../domain/entities/Product"'
        );
        expect(content).to.include(
          'import { Order } from "../../domain/entities/Order"'
        );

        // Check repository imports
        expect(content).to.include(
          'import { UserRepository } from "../../infrastructure/repositories/UserRepository"'
        );
        expect(content).to.include(
          'import { ProductRepository } from "../../infrastructure/repositories/ProductRepository"'
        );
        expect(content).to.include(
          'import { OrderRepository } from "../../infrastructure/repositories/OrderRepository"'
        );

        // Check registrations
        expect(content).to.include('user: asClass(User).singleton()');
        expect(content).to.include('product: asClass(Product).singleton()');
        expect(content).to.include('order: asClass(Order).singleton()');
        expect(content).to.include(
          'userRepository: asClass(UserRepository).singleton()'
        );
        expect(content).to.include(
          'productRepository: asClass(ProductRepository).singleton()'
        );
        expect(content).to.include(
          'orderRepository: asClass(OrderRepository).singleton()'
        );
      });

      it('should generate config with multiple domain services', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          [],
          ['UserService', 'ProductService', 'OrderService'],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check imports
        expect(content).to.include(
          'import { UserService } from "../../domain/services/UserService"'
        );
        expect(content).to.include(
          'import { ProductService } from "../../domain/services/ProductService"'
        );
        expect(content).to.include(
          'import { OrderService } from "../../domain/services/OrderService"'
        );

        // Check registrations
        expect(content).to.include(
          'userService: asClass(UserService).singleton()'
        );
        expect(content).to.include(
          'productService: asClass(ProductService).singleton()'
        );
        expect(content).to.include(
          'orderService: asClass(OrderService).singleton()'
        );
      });

      it('should generate config with multiple application services', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          [],
          [],
          ['UserAppService', 'ProductAppService', 'OrderAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check imports
        expect(content).to.include(
          'import { UserAppService } from "../../application/services/UserAppService"'
        );
        expect(content).to.include(
          'import { ProductAppService } from "../../application/services/ProductAppService"'
        );
        expect(content).to.include(
          'import { OrderAppService } from "../../application/services/OrderAppService"'
        );

        // Check registrations
        expect(content).to.include(
          'userAppService: asClass(UserAppService).singleton()'
        );
        expect(content).to.include(
          'productAppService: asClass(ProductAppService).singleton()'
        );
        expect(content).to.include(
          'orderAppService: asClass(OrderAppService).singleton()'
        );
      });
    });

    describe('when generating comprehensive configuration', () => {
      it('should generate config with all service types', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User', 'Product'],
          ['UserService', 'ProductService'],
          ['UserAppService', 'ProductAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check all imports are present
        expect(content).to.include(
          'import { User } from "../../domain/entities/User"'
        );
        expect(content).to.include(
          'import { Product } from "../../domain/entities/Product"'
        );
        expect(content).to.include(
          'import { UserRepository } from "../../infrastructure/repositories/UserRepository"'
        );
        expect(content).to.include(
          'import { ProductRepository } from "../../infrastructure/repositories/ProductRepository"'
        );
        expect(content).to.include(
          'import { UserService } from "../../domain/services/UserService"'
        );
        expect(content).to.include(
          'import { ProductService } from "../../domain/services/ProductService"'
        );
        expect(content).to.include(
          'import { UserAppService } from "../../application/services/UserAppService"'
        );
        expect(content).to.include(
          'import { ProductAppService } from "../../application/services/ProductAppService"'
        );

        // Check all registrations are present
        expect(content).to.include('user: asClass(User).singleton()');
        expect(content).to.include('product: asClass(Product).singleton()');
        expect(content).to.include(
          'userRepository: asClass(UserRepository).singleton()'
        );
        expect(content).to.include(
          'productRepository: asClass(ProductRepository).singleton()'
        );
        expect(content).to.include(
          'userService: asClass(UserService).singleton()'
        );
        expect(content).to.include(
          'productService: asClass(ProductService).singleton()'
        );
        expect(content).to.include(
          'userAppService: asClass(UserAppService).singleton()'
        );
        expect(content).to.include(
          'productAppService: asClass(ProductAppService).singleton()'
        );
      });

      it('should maintain proper registration order', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          ['UserService'],
          ['UserAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Entity registrations should come first
        const userEntityIndex = content.indexOf(
          'user: asClass(User).singleton()'
        );
        const userRepoIndex = content.indexOf(
          'userRepository: asClass(UserRepository).singleton()'
        );
        const userServiceIndex = content.indexOf(
          'userService: asClass(UserService).singleton()'
        );
        const userAppServiceIndex = content.indexOf(
          'userAppService: asClass(UserAppService).singleton()'
        );

        expect(userEntityIndex).to.be.lessThan(userRepoIndex);
        expect(userRepoIndex).to.be.lessThan(userServiceIndex);
        expect(userServiceIndex).to.be.lessThan(userAppServiceIndex);
      });
    });

    describe('when handling edge cases', () => {
      it('should generate config with empty arrays', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          [],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        expect(result).to.be.instanceOf(FileEntity);
        const content = result.content;

        // Should still contain basic structure
        expect(content).to.include(
          'import { createContainer, asClass, InjectionMode } from "awilix"'
        );
        expect(content).to.include(
          'const container = createContainer({ injectionMode: InjectionMode.CLASSIC })'
        );
        expect(content).to.include('container.register({');
        expect(content).to.include('});');
        expect(content).to.include('export default container;');

        // Should not contain any service registrations
        expect(content).to.not.include(': asClass(');
      });

      it('should handle entities with special characters in names', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User_Profile', 'API_Key'],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        expect(content).to.include(
          'import { User_Profile } from "../../domain/entities/User_Profile"'
        );
        expect(content).to.include(
          'import { API_Key } from "../../domain/entities/API_Key"'
        );
        expect(content).to.include(
          'user_Profile: asClass(User_Profile).singleton()'
        );
        expect(content).to.include('aPI_Key: asClass(API_Key).singleton()');
      });

      it('should handle services with numeric suffixes', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User2', 'Product3'],
          ['UserService2'],
          ['UserAppService3']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        expect(content).to.include('user2: asClass(User2).singleton()');
        expect(content).to.include('product3: asClass(Product3).singleton()');
        expect(content).to.include(
          'userService2: asClass(UserService2).singleton()'
        );
        expect(content).to.include(
          'userAppService3: asClass(UserAppService3).singleton()'
        );
      });
    });

    describe('when validating file path handling', () => {
      it('should use provided config path correctly', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          [],
          []
        );
        const customPath = 'custom/path/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, customPath);

        expect(result.filePath).to.equal(customPath);
      });

      it('should handle different path formats', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          [],
          []
        );
        const testPaths = [
          'awilix.config.ts',
          './config/awilix.config.ts',
          '/absolute/path/awilix.config.ts',
          'deeply/nested/path/structure/awilix.config.ts',
        ];

        for (const testPath of testPaths) {
          const result = service.generateAwilixConfigFile(config, testPath);
          expect(result.filePath).to.equal(testPath);
        }
      });
    });

    describe('when validating generated code structure', () => {
      it('should generate valid TypeScript imports', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          ['UserService'],
          ['UserAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check import structure
        const importRegex = /import\s+{\s*\w+\s*}\s+from\s+"[^"]+";/g;
        const imports = content.match(importRegex);

        expect(imports).to.be.an('array');
        expect(imports!.length).to.be.greaterThan(0);

        // Verify each import is properly formatted
        imports!.forEach(importStatement => {
          expect(importStatement).to.match(
            /^import\s+{\s*\w+\s*}\s+from\s+"[^"]+";$/
          );
        });
      });

      it('should generate valid registration syntax', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          ['UserService'],
          ['UserAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check registration structure
        const registrationRegex = /\s*\w+:\s*asClass\(\w+\)\.singleton\(\),/g;
        const registrations = content.match(registrationRegex);

        expect(registrations).to.be.an('array');
        expect(registrations!.length).to.be.greaterThan(0);

        // Verify each registration is properly formatted
        registrations!.forEach(registration => {
          expect(registration).to.match(
            /^\s*\w+:\s*asClass\(\w+\)\.singleton\(\),$/
          );
        });
      });

      it('should generate complete container structure', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check for required container structure
        expect(content).to.include(
          'const container = createContainer({ injectionMode: InjectionMode.CLASSIC });'
        );
        expect(content).to.include('container.register({');
        expect(content).to.include('});');
        expect(content).to.include('export default container;');

        // Verify the structure is in correct order
        const containerIndex = content.indexOf(
          'const container = createContainer'
        );
        const registerIndex = content.indexOf('container.register({');
        const exportIndex = content.indexOf('export default container;');

        expect(containerIndex).to.be.lessThan(registerIndex);
        expect(registerIndex).to.be.lessThan(exportIndex);
      });
    });

    describe('when handling naming conventions', () => {
      it('should convert class names to camelCase for registration keys', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['UserProfile', 'APIKey', 'HTTPClient'],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        expect(content).to.include(
          'userProfile: asClass(UserProfile).singleton()'
        );
        expect(content).to.include('aPIKey: asClass(APIKey).singleton()');
        expect(content).to.include(
          'hTTPClient: asClass(HTTPClient).singleton()'
        );
      });

      it('should handle single character class names', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['A', 'B'],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        expect(content).to.include('a: asClass(A).singleton()');
        expect(content).to.include('b: asClass(B).singleton()');
      });

      it('should generate correct repository class names', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User', 'Product'],
          [],
          []
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        expect(content).to.include('UserRepository');
        expect(content).to.include('ProductRepository');
        expect(content).to.include(
          'userRepository: asClass(UserRepository).singleton()'
        );
        expect(content).to.include(
          'productRepository: asClass(ProductRepository).singleton()'
        );
      });
    });
  });

  describe('integration scenarios', () => {
    describe('when generating complex real-world configurations', () => {
      it('should handle e-commerce domain configuration', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User', 'Product', 'Order', 'Payment', 'Cart'],
          ['UserService', 'ProductService', 'OrderService', 'PaymentService'],
          [
            'UserAppService',
            'ProductAppService',
            'OrderAppService',
            'CartAppService',
          ]
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Verify comprehensive registration count
        const registrationCount = (content.match(/asClass\(/g) || []).length;
        expect(registrationCount).to.equal(18); // 5 entities + 5 repos + 4 domain services + 4 app services

        // Verify complete structure
        expect(content).to.include('createContainer');
        expect(content).to.include('container.register');
        expect(content).to.include('export default container');
      });

      it('should generate valid code for large configurations', () => {
        const entities = Array.from({ length: 10 }, (_, i) => `Entity${i + 1}`);
        const domainServices = Array.from(
          { length: 8 },
          (_, i) => `DomainService${i + 1}`
        );
        const appServices = Array.from(
          { length: 6 },
          (_, i) => `AppService${i + 1}`
        );

        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          entities,
          domainServices,
          appServices
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check that all services are registered
        const registrationCount = (content.match(/asClass\(/g) || []).length;
        expect(registrationCount).to.equal(34); // 10 entities + 10 repos + 8 domain + 6 app

        // Verify structure integrity with many registrations
        expect(content).to.include('container.register({');
        expect(content).to.include('});');
        expect(
          content.split('\n').filter(line => line.includes('singleton()'))
            .length
        ).to.equal(34);
      });

      it('should maintain consistency across multiple generations', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User', 'Product'],
          ['UserService'],
          ['UserAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result1 = service.generateAwilixConfigFile(config, configPath);
        const result2 = service.generateAwilixConfigFile(config, configPath);

        expect(result1.content).to.equal(result2.content);
        expect(result1.filePath).to.equal(result2.filePath);
      });
    });

    describe('when validating output quality', () => {
      it('should generate properly formatted TypeScript code', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User'],
          ['UserService'],
          ['UserAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Check proper indentation and formatting
        const lines = content.split('\n');
        const registerBlock = lines.slice(
          lines.findIndex(line => line.includes('container.register({')),
          lines.findIndex(line => line.includes('});')) + 1
        );

        // All registration lines should be properly indented
        registerBlock.slice(1, -1).forEach(line => {
          if (line.trim().length > 0) {
            expect(line).to.match(
              /^\s\s\w+:\s*asClass\(\w+\)\.singleton\(\),$/
            );
          }
        });
      });

      it('should generate clean import statements', () => {
        const config = new AwilixConfig(
          'src/infrastructure/Configuration',
          ['User', 'Product'],
          ['UserService'],
          ['ProductAppService']
        );
        const configPath = 'src/infrastructure/configuration/awilix.config.ts';

        const result = service.generateAwilixConfigFile(config, configPath);

        const content = result.content;

        // Extract import section
        const awilixImportIndex = content.indexOf('import { createContainer');
        const firstServiceImportIndex = content.indexOf('import { User');

        expect(awilixImportIndex).to.be.lessThan(firstServiceImportIndex);

        // Check import formatting
        const importLines = content
          .split('\n')
          .filter(
            line =>
              line.trim().startsWith('import {') && !line.includes('awilix')
          );

        importLines.forEach(importLine => {
          expect(importLine).to.match(/^import { \w+ } from "[^"]+";$/);
        });
      });
    });
  });
});
