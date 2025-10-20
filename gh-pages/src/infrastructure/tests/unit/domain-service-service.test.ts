import { expect } from 'chai';
import { DomainServiceService } from '../../../../../lib/domain/services/domain-service-service';
import { FileEntity } from '../../../../../lib/domain/entities/file-entity';
import { Entity } from '../../../../../lib/domain/entities/entity';

describe('DomainServiceService', () => {
  let service: DomainServiceService;

  beforeEach(() => {
    service = new DomainServiceService();
  });

  describe('generateDomainServicesFiles', () => {
    const mockTemplateContent = `{{#if entities.length}}
  {{#each entities}}
import { {{name}} } from "../entities/{{name}}";
  {{/each}}
{{/if}}
{{#if useAngularDI}}
import { Injectable } from '@angular/core';
{{/if}}
/**
 * Domain Service: {{serviceName}}
*/
{{#if useAngularDI}}
@Injectable({ providedIn: 'root' })
{{/if}}
export class {{serviceName}} {
  constructor(
  {{#each entities}}
    private readonly {{lowerFirst name}}: {{name}}{{#unless @last}},{{/unless}}
  {{/each}}
  ) {}

  public exampleMethod(): void {
  {{#if entities.length}}
    // this.{{lowerFirst entities.[0].name}}...
  {{else}}
    // No injected entities
  {{/if}}
  }
}`;

    const servicesDir = 'src/domain/Services';

    it('should generate correct file paths for domain services', () => {
      const connections = {
        UserService: ['User'],
        ProductService: ['Product', 'Category'],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      expect(result).to.have.lengthOf(2);
      expect(result[0].filePath).to.equal(`${servicesDir}/UserService.ts`);
      expect(result[1].filePath).to.equal(`${servicesDir}/ProductService.ts`);
    });

    it('should return FileEntity instances with correct structure', () => {
      const connections = {
        TestService: ['TestEntity'],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      expect(result[0]).to.be.instanceOf(FileEntity);
      expect(result[0].filePath).to.be.a('string');
      expect(result[0].content).to.be.a('string');
    });

    it('should use Angular DI when framework is angular', () => {
      const connections = {
        UserService: ['User'],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'angular',
        mockTemplateContent
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include("@Injectable({ providedIn: 'root' })");
      expect(generatedCode).to.include(
        "import { Injectable } from '@angular/core';"
      );
    });

    it('should not use Angular DI when framework is awilix', () => {
      const connections = {
        UserService: ['User'],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.not.include('@Injectable');
      expect(generatedCode).to.not.include('import { Injectable }');
    });

    it('should generate correct entity imports and methods', () => {
      const connections = {
        UserService: ['User', 'Profile'],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'import { User } from "../entities/User";'
      );
      expect(generatedCode).to.include(
        'import { Profile } from "../entities/Profile";'
      );
      expect(generatedCode).to.include('public exampleMethod(): void');
      expect(generatedCode).to.include('private readonly user: User');
      expect(generatedCode).to.include('private readonly profile: Profile');
    });

    it('should handle services with no entities', () => {
      const connections = {
        UtilityService: [],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      expect(result).to.have.lengthOf(1);
      const generatedCode = result[0].content;
      expect(generatedCode).to.include('export class UtilityService');
      expect(generatedCode).to.not.include('import {');
      expect(generatedCode).to.not.include('process');
    });

    it('should handle empty connections gracefully', () => {
      const connections = {};

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should handle multiple services with different entity sets', () => {
      const connections = {
        UserService: ['User', 'Profile'],
        ProductService: ['Product'],
        OrderService: ['Order', 'OrderItem', 'Payment'],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      expect(result).to.have.lengthOf(3);

      const userService = result.find(f => f.filePath.includes('UserService'));
      const productService = result.find(f =>
        f.filePath.includes('ProductService')
      );
      const orderService = result.find(f =>
        f.filePath.includes('OrderService')
      );

      expect(userService?.content).to.include('public exampleMethod(): void');
      expect(userService?.content).to.include('private readonly user: User');
      expect(userService?.content).to.include(
        'private readonly profile: Profile'
      );

      expect(productService?.content).to.include(
        'public exampleMethod(): void'
      );
      expect(productService?.content).to.include(
        'private readonly product: Product'
      );
      expect(productService?.content).to.not.include(
        'private readonly user: User'
      );

      expect(orderService?.content).to.include('public exampleMethod(): void');
      expect(orderService?.content).to.include('private readonly order: Order');
      expect(orderService?.content).to.include(
        'private readonly orderItem: OrderItem'
      );
      expect(orderService?.content).to.include(
        'private readonly payment: Payment'
      );
    });

    it('should handle different directory paths correctly', () => {
      const connections = {
        CustomService: ['Entity'],
      };
      const customDir = 'custom/path/to/services';

      const result = service.generateDomainServicesFiles(
        customDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      expect(result[0].filePath).to.equal(`${customDir}/CustomService.ts`);
    });

    it('should substitute service name correctly in template', () => {
      const connections = {
        CustomerManagementService: ['Customer'],
      };

      const result = service.generateDomainServicesFiles(
        servicesDir,
        connections,
        'awilix',
        mockTemplateContent
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'export class CustomerManagementService'
      );
    });
  });

  describe('generateDomainServiceCodeFromTemplate', () => {
    const simpleTemplate = `
export class {{serviceName}} {
  {{#if entities}}
  entities: [{{#each entities}}"{{name}}"{{#unless @last}}, {{/unless}}{{/each}}]
  {{/if}}
  {{#if useAngularDI}}
  framework: "angular"
  {{else}}
  framework: "awilix"
  {{/if}}
}`;

    it('should generate code with correct service name', () => {
      const entities = [new Entity('User')];
      const result = service.generateDomainServiceCodeFromTemplate(
        simpleTemplate,
        'UserService',
        'awilix',
        entities
      );

      expect(result).to.include('export class UserService');
    });

    it('should handle Angular DI framework correctly', () => {
      const entities = [new Entity('User')];
      const result = service.generateDomainServiceCodeFromTemplate(
        simpleTemplate,
        'UserService',
        'angular',
        entities
      );

      expect(result).to.include('framework: "angular"');
    });

    it('should handle Awilix framework correctly', () => {
      const entities = [new Entity('User')];
      const result = service.generateDomainServiceCodeFromTemplate(
        simpleTemplate,
        'UserService',
        'awilix',
        entities
      );

      expect(result).to.include('framework: "awilix"');
    });

    it('should handle entities correctly', () => {
      const entities = [new Entity('User'), new Entity('Product')];
      const result = service.generateDomainServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix',
        entities
      );

      expect(result).to.include('entities: ["User", "Product"]');
    });

    it('should handle empty entities gracefully', () => {
      const result = service.generateDomainServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix',
        []
      );

      expect(result).to.include('export class TestService');
      expect(result).to.not.include('entities:');
    });

    it('should handle undefined entities gracefully', () => {
      const result = service.generateDomainServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix'
      );

      expect(result).to.include('export class TestService');
      expect(result).to.not.include('entities:');
    });
  });

  describe('connectAndGenerateFiles', () => {
    const mockTemplateContent = `{{#if entities.length}}
  {{#each entities}}
import { {{name}} } from "../entities/{{name}}";
  {{/each}}
{{/if}}
{{#if useAngularDI}}
import { Injectable } from '@angular/core';
{{/if}}
/**
 * Domain Service: {{serviceName}}
*/
{{#if useAngularDI}}
@Injectable({ providedIn: 'root' })
{{/if}}
export class {{serviceName}} {
  constructor(
  {{#each entities}}
    private readonly {{lowerFirst name}}: {{name}}{{#unless @last}},{{/unless}}
  {{/each}}
  ) {}

  public exampleMethod(): void {
  {{#if entities.length}}
    // this.{{lowerFirst entities.[0].name}}...
  {{else}}
    // No injected entities
  {{/if}}
  }
}`;

    it('should use user-defined connections when provided', () => {
      const params = {
        servicesDir: 'src/domain/Services',
        domainServiceNames: ['UserService', 'ProductService'],
        entityNames: ['User', 'Product', 'Order'],
        diFramework: 'awilix' as const,
        templateContent: mockTemplateContent,
        userConfig: {
          domainServiceConnections: {
            UserService: ['User'],
            ProductService: ['Product', 'Order'],
          },
        },
      };

      const result = service.connectAndGenerateFiles(params);

      expect(result).to.have.lengthOf(2);

      const userService = result.find(f => f.filePath.includes('UserService'));
      const productService = result.find(f =>
        f.filePath.includes('ProductService')
      );

      expect(userService?.content).to.include('import { User }');
      expect(userService?.content).to.not.include('import { Product }');

      expect(productService?.content).to.include('import { Product }');
      expect(productService?.content).to.include('import { Order }');
    });

    it('should create default connections when user config is empty', () => {
      const params = {
        servicesDir: 'src/domain/Services',
        domainServiceNames: ['UserService', 'ProductService'],
        entityNames: ['User', 'Product'],
        diFramework: 'awilix' as const,
        templateContent: mockTemplateContent,
        userConfig: {},
      };

      const result = service.connectAndGenerateFiles(params);

      expect(result).to.have.lengthOf(2);

      // Each service should have all entities in default connections
      result.forEach(file => {
        expect(file.content).to.include('import { User }');
        expect(file.content).to.include('import { Product }');
      });
    });

    it('should create default connections when user config is not provided', () => {
      const params = {
        servicesDir: 'src/domain/Services',
        domainServiceNames: ['TestService'],
        entityNames: ['Test'],
        diFramework: 'awilix' as const,
        templateContent: mockTemplateContent,
      };

      const result = service.connectAndGenerateFiles(params);

      expect(result).to.have.lengthOf(1);
      expect(result[0].content).to.include('import { Test }');
    });

    it('should handle empty domain service names', () => {
      const params = {
        servicesDir: 'src/domain/Services',
        domainServiceNames: [],
        entityNames: ['User', 'Product'],
        diFramework: 'awilix' as const,
        templateContent: mockTemplateContent,
      };

      const result = service.connectAndGenerateFiles(params);

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should handle empty entity names', () => {
      const params = {
        servicesDir: 'src/domain/Services',
        domainServiceNames: ['UserService'],
        entityNames: [],
        diFramework: 'awilix' as const,
        templateContent: mockTemplateContent,
      };

      const result = service.connectAndGenerateFiles(params);

      expect(result).to.have.lengthOf(1);
      expect(result[0].content).to.include('// No injected entities');
    });
  });
});
