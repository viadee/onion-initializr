import { expect } from 'chai';
import { RepoService } from '../../../domain/services/RepoService';
import { FileEntity } from '../../../domain/entities/FileEntity';

describe('RepoService', () => {
  let service: RepoService;

  beforeEach(() => {
    service = new RepoService();
  });

  describe('generateRepositoriesFiles', () => {
    const mockTemplateContent = `import { {{entityName}} } from "../../domain/entities/{{entityName}}";
import { I{{entityName}}Repository } from "../../domain/interfaces/I{{entityName}}Repository";
{{#if useAngularDI}}
import { Injectable } from '@angular/core';
{{/if}}

/**
 * Repository: {{entityName}}Repository
*/
{{#if useAngularDI}}
@Injectable({ providedIn: 'root' })
{{/if}}
export class {{entityName}}Repository implements I{{entityName}}Repository {
  public async findAll(): Promise<{{{entityName}}}[] | null> {
    // TODO: Implement retrieval from DB or other data source
    return [];
  }

  public async findById(id: string): Promise<{{entityName}} | null> {
    // TODO: Implement retrieval from DB or other data source
    console.log('findById in {{entityName}}Repository called with id: ', id);
    return null;
  }

  public async save({{lowerFirst entityName}}: {{entityName}}): Promise<void> {
    // TODO: Implement persist logic
  }

  public async delete(id: string): Promise<void> {
    // TODO: Implement delete logic
  }

  // TODO: Add more methods if defined in I{{entityName}}Repository
}`;

    const infraRepoDir = 'src/infrastructure/Repositories';

    it('should generate correct file paths for entities', () => {
      const entities = ['User', 'Product'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      expect(result).to.have.lengthOf(2);
      expect(result[0].filePath).to.equal(`${infraRepoDir}/UserRepository.ts`);
      expect(result[1].filePath).to.equal(
        `${infraRepoDir}/ProductRepository.ts`
      );
    });

    it('should return FileEntity instances with correct structure', () => {
      const entities = ['Order'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      expect(result[0]).to.be.instanceOf(FileEntity);
      expect(result[0].filePath).to.be.a('string');
      expect(result[0].content).to.be.a('string');
    });

    it('should use Angular DI when framework is angular', () => {
      const entities = ['User'];
      const result = service.generateRepositoriesFiles(
        entities,
        'angular',
        mockTemplateContent,
        infraRepoDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include("@Injectable({ providedIn: 'root' })");
      expect(generatedCode).to.include(
        "import { Injectable } from '@angular/core';"
      );
    });

    it('should not use Angular DI when framework is awilix', () => {
      const entities = ['User'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.not.include('@Injectable');
      expect(generatedCode).to.not.include('import { Injectable }');
    });

    it('should substitute entity name correctly in template', () => {
      const entities = ['Customer'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include('import { Customer }');
      expect(generatedCode).to.include('import { ICustomerRepository }');
      expect(generatedCode).to.include('export class CustomerRepository');
    });

    it('should handle empty entity list gracefully', () => {
      const entities: string[] = [];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should handle multiple entities correctly', () => {
      const entities = ['User', 'Product', 'Order', 'Customer'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      expect(result).to.have.lengthOf(4);

      const filePaths = result.map(file => file.filePath);
      expect(filePaths).to.include(`${infraRepoDir}/UserRepository.ts`);
      expect(filePaths).to.include(`${infraRepoDir}/ProductRepository.ts`);
      expect(filePaths).to.include(`${infraRepoDir}/OrderRepository.ts`);
      expect(filePaths).to.include(`${infraRepoDir}/CustomerRepository.ts`);
    });

    it('should handle entities with special characters in names', () => {
      const entities = ['User_Profile', 'Product-Item'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      expect(result).to.have.lengthOf(2);
      expect(result[0].filePath).to.equal(
        `${infraRepoDir}/User_ProfileRepository.ts`
      );
      expect(result[1].filePath).to.equal(
        `${infraRepoDir}/Product-ItemRepository.ts`
      );
    });

    it('should handle entities with numeric characters', () => {
      const entities = ['User2', 'Product123'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        infraRepoDir
      );

      expect(result).to.have.lengthOf(2);
      const generatedCode1 = result[0].content;
      const generatedCode2 = result[1].content;

      expect(generatedCode1).to.include('export class User2Repository');
      expect(generatedCode2).to.include('export class Product123Repository');
    });

    it('should handle different directory paths correctly', () => {
      const entities = ['User'];
      const customDir = 'custom/path/to/repositories';
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        mockTemplateContent,
        customDir
      );

      expect(result[0].filePath).to.equal(`${customDir}/UserRepository.ts`);
    });

    it('should compile template with lowerFirst helper', () => {
      const templateWithHelper = `
const {{lowerFirst entityName}}Repository = new {{entityName}}Repository();
export { {{lowerFirst entityName}}Repository };`;

      const entities = ['UserProfile'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        templateWithHelper,
        infraRepoDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'const userProfileRepository = new UserProfileRepository()'
      );
      expect(generatedCode).to.include('export { userProfileRepository }');
    });

    it('should handle lowerFirst helper with empty string', () => {
      const templateWithHelper = `{{lowerFirst ""}}`;
      const entities = ['User'];

      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        templateWithHelper,
        infraRepoDir
      );

      expect(result[0].content.trim()).to.equal('');
    });

    it('should handle lowerFirst helper with single character', () => {
      const templateWithHelper = `{{lowerFirst "A"}}`;
      const entities = ['User'];

      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        templateWithHelper,
        infraRepoDir
      );

      expect(result[0].content.trim()).to.equal('a');
    });

    it('should handle complex template with both DI frameworks', () => {
      const complexTemplate = `
{{#if useAngularDI}}
import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
{{/if}}
export class {{entityName}}Repository {
  private {{lowerFirst entityName}}s: {{entityName}}[] = [];
  
  {{#if useAngularDI}}
  constructor() {
    console.log('Angular DI {{entityName}}Repository created');
  }
  {{else}}
  constructor() {
    console.log('Awilix {{entityName}}Repository created');
  }
  {{/if}}
}`;

      const entities = ['Product'];

      const angularResult = service.generateRepositoriesFiles(
        entities,
        'angular',
        complexTemplate,
        infraRepoDir
      );

      const awilixResult = service.generateRepositoriesFiles(
        entities,
        'awilix',
        complexTemplate,
        infraRepoDir
      );

      const angularCode = angularResult[0].content;
      const awilixCode = awilixResult[0].content;

      expect(angularCode).to.include("@Injectable({ providedIn: 'root' })");
      expect(angularCode).to.include('Angular DI ProductRepository created');
      expect(angularCode).to.include('private products: Product[] = [];');

      expect(awilixCode).to.not.include('@Injectable');
      expect(awilixCode).to.include('Awilix ProductRepository created');
      expect(awilixCode).to.include('private products: Product[] = [];');
    });

    it('should preserve template structure and formatting', () => {
      const formattedTemplate = `import { {{entityName}} } from "../../domain/entities/{{entityName}}";

export class {{entityName}}Repository {
  async findAll(): Promise<{{entityName}}[]> {
    return [];
  }
}`;

      const entities = ['User'];
      const result = service.generateRepositoriesFiles(
        entities,
        'awilix',
        formattedTemplate,
        infraRepoDir
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'import { User } from "../../domain/entities/User";'
      );
      expect(generatedCode).to.include('export class UserRepository {');
      expect(generatedCode).to.include('async findAll(): Promise<User[]>');
    });
  });
});
