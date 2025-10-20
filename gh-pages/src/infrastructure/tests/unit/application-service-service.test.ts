import { ApplicationServiceService } from './../../../../../lib/Domain/Services/ApplicationServiceService';
import { FileEntity } from './../../../../../lib/Domain/Entities/FileEntity';
import { expect } from 'chai';

describe('ApplicationServiceService', () => {
  let service: ApplicationServiceService;

  beforeEach(() => {
    service = new ApplicationServiceService();
  });

  describe('generateApplicationServicesFiles', () => {
    const mockTemplateContent = `{{#each domainServices}}
  {{#if this}}
import { {{this}} } from "../../Domain/Services/{{this}}";
  {{/if}}
{{/each}}

{{#each repositories}}
  {{#if this}}
import { {{this}} } from "../../Domain/Interfaces/{{this}}";
  {{/if}}
{{/each}}
{{#if useAngularDI}}
import { Injectable, Inject } from '@angular/core';
{{#if repositories}}
import { {{#each repositories}}{{toUpperSnakeCase (removeFirst this)}}_TOKEN{{#unless @last}}, {{/unless}}{{/each}} } from '../../Infrastructure/Presentation/injection-tokens';
{{/if}}
{{/if}}

/**
 * Application Service: {{name}}
*/
{{#if useAngularDI}}
@Injectable({ providedIn: 'root' })
{{/if}}
export class {{name}} {
  constructor(
    {{#each domainServices}}
      {{#if this}}private readonly {{lowerFirst this}}: {{this}},{{/if}}
    {{/each}}
    {{#each repositories}}
      {{#if this}}{{#if ../useAngularDI}}@Inject({{toUpperSnakeCase (removeFirst this)}}_TOKEN) {{/if}}private readonly {{lowerFirst (removeFirst this)}}: {{this}},{{/if}}
    {{/each}}
  ) {}

  public async runExampleUseCase(): Promise<void> {
    {{#if repositories.length}}
    const someEntity = await this.{{firstRepoVarName repositories}}.findById("someId");
    {{else}}
    // No repositories to call
    {{/if}}

    {{#if domainServices.length}}
    // this.{{firstServiceVarName domainServices}}.exampleMethod();
    {{else}}
    // No domain services to call
    {{/if}}
  }
}`;

    const appDir = 'src/Application/Services';

    it('should generate correct file paths for application services', () => {
      const mappings = {
        UserManagementAppService: {
          domainServices: ['UserService'],
          repositories: ['User'],
        },
        ProductCatalogAppService: {
          domainServices: ['ProductService'],
          repositories: ['Product'],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      expect(result).to.have.lengthOf(2);
      expect(result[0].filePath).to.equal(
        `${appDir}/UserManagementAppService.ts`
      );
      expect(result[1].filePath).to.equal(
        `${appDir}/ProductCatalogAppService.ts`
      );
    });

    it('should return FileEntity instances with correct structure', () => {
      const mappings = {
        TestAppService: {
          domainServices: ['TestService'],
          repositories: ['Test'],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      expect(result[0]).to.be.instanceOf(FileEntity);
      expect(result[0].filePath).to.be.a('string');
      expect(result[0].content).to.be.a('string');
    });

    it('should use Angular DI when framework is angular', () => {
      const mappings = {
        UserAppService: {
          domainServices: ['UserService'],
          repositories: ['User'],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'angular',
        mockTemplateContent,
        appDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include("@Injectable({ providedIn: 'root' })");
      expect(generatedCode).to.include(
        "import { Injectable } from '@angular/core';"
      );
    });

    it('should not use Angular DI when framework is awilix', () => {
      const mappings = {
        UserAppService: {
          domainServices: ['UserService'],
          repositories: ['User'],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.not.include('@Injectable');
    });

    it('should handle services with only repositories', () => {
      const mappings = {
        DataAccessAppService: {
          domainServices: [],
          repositories: ['IUserRepository', 'IProductRepository'],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include('import { IUserRepository }');
      expect(generatedCode).to.include('import { IProductRepository }');
      expect(generatedCode).to.include(
        'private readonly userRepository: IUserRepository'
      );
      expect(generatedCode).to.include(
        'private readonly productRepository: IProductRepository'
      );
    });

    it('should handle services with only domain services', () => {
      const mappings = {
        BusinessLogicAppService: {
          domainServices: ['UserService', 'EmailService'],
          repositories: [],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include('import { UserService }');
      expect(generatedCode).to.include('import { EmailService }');
      expect(generatedCode).to.include(
        'private readonly userService: UserService'
      );
      expect(generatedCode).to.include(
        'private readonly emailService: EmailService'
      );
    });

    it('should handle services with both repositories and domain services', () => {
      const mappings = {
        ComplexAppService: {
          domainServices: ['UserService', 'NotificationService'],
          repositories: ['IUserRepository', 'ILogRepository'],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include('import { IUserRepository }');
      expect(generatedCode).to.include('import { ILogRepository }');
      expect(generatedCode).to.include('import { UserService }');
      expect(generatedCode).to.include('import { NotificationService }');
      expect(generatedCode).to.include(
        'private readonly userRepository: IUserRepository'
      );
      expect(generatedCode).to.include(
        'private readonly logRepository: ILogRepository'
      );
      expect(generatedCode).to.include(
        'private readonly userService: UserService'
      );
      expect(generatedCode).to.include(
        'private readonly notificationService: NotificationService'
      );
    });

    it('should handle empty mappings gracefully', () => {
      const mappings = {};

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should handle services with no dependencies', () => {
      const mappings = {
        SimpleAppService: {
          domainServices: [],
          repositories: [],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      expect(result).to.have.lengthOf(1);
      const generatedCode = result[0].content;
      expect(generatedCode).to.include('export class SimpleAppService');
      expect(generatedCode).to.include('constructor(');
    });

    it('should handle different directory paths correctly', () => {
      const mappings = {
        CustomAppService: {
          domainServices: ['TestService'],
          repositories: ['Test'],
        },
      };
      const customDir = 'custom/path/to/services';

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        customDir
      );

      expect(result[0].filePath).to.equal(`${customDir}/CustomAppService.ts`);
    });

    it('should substitute service name correctly in template', () => {
      const mappings = {
        CustomerManagementAppService: {
          domainServices: ['CustomerService'],
          repositories: ['Customer'],
        },
      };

      const result = service.generateApplicationServicesFiles(
        mappings,
        'awilix',
        mockTemplateContent,
        appDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'export class CustomerManagementAppService'
      );
    });
  });

  describe('generateApplicationServiceCodeFromTemplate', () => {
    const simpleTemplate = `
export class {{name}} {
  {{#if repositories}}
  repositories: [{{#each repositories}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]
  {{/if}}
  {{#if domainServices}}
  domainServices: [{{#each domainServices}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}]
  {{/if}}
  {{#if useAngularDI}}
  framework: "angular"
  {{else}}
  framework: "awilix"
  {{/if}}
}`;

    it('should generate code with correct service name', () => {
      const result = service.generateApplicationServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix',
        { domainServices: [], repositories: [] }
      );

      expect(result).to.include('export class TestService');
    });

    it('should handle Angular DI framework correctly', () => {
      const result = service.generateApplicationServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'angular',
        { domainServices: [], repositories: [] }
      );

      expect(result).to.include('framework: "angular"');
    });

    it('should handle Awilix framework correctly', () => {
      const result = service.generateApplicationServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix',
        { domainServices: [], repositories: [] }
      );

      expect(result).to.include('framework: "awilix"');
    });

    it('should handle repositories correctly', () => {
      const result = service.generateApplicationServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix',
        { repositories: ['User', 'Product'] }
      );

      expect(result).to.include('repositories: ["User", "Product"]');
    });

    it('should handle domain services correctly', () => {
      const result = service.generateApplicationServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix',
        { domainServices: ['UserService', 'EmailService'] }
      );

      expect(result).to.include(
        'domainServices: ["UserService", "EmailService"]'
      );
    });

    it('should handle empty dependencies gracefully', () => {
      const result = service.generateApplicationServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix',
        {}
      );

      expect(result).to.include('export class TestService');
      expect(result).to.not.include('repositories:');
      expect(result).to.not.include('domainServices:');
    });

    it('should handle undefined dependencies gracefully', () => {
      const result = service.generateApplicationServiceCodeFromTemplate(
        simpleTemplate,
        'TestService',
        'awilix'
      );

      expect(result).to.include('export class TestService');
      expect(result).to.not.include('repositories:');
      expect(result).to.not.include('domainServices:');
    });
  });
});
