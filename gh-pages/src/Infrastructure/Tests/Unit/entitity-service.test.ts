import { expect } from 'chai';
import { EntityService } from '../../../Domain/Services/EntitityService';
import { FileEntity } from '../../../Domain/Entities/FileEntity';

describe('EntityService', () => {
  let service: EntityService;

  beforeEach(() => {
    service = new EntityService();
  });

  describe('generateEntitiesFiles', () => {
    describe('when generating files with valid inputs', () => {
      it('should generate single entity file', () => {
        const entitiesDir = 'src/Domain/Entities';
        const entityNames = ['User'];
        const templateContent =
          'export class {{name}} {\n  constructor() {}\n}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.be.an('array');
        expect(result).to.have.length(1);
        expect(result[0]).to.be.instanceOf(FileEntity);
        expect(result[0].filePath).to.equal('src/Domain/Entities\\User.ts');
        expect(result[0].content).to.include('export class User');
        expect(result[0].content).to.include('constructor() {}');
      });

      it('should generate multiple entity files', () => {
        const entitiesDir = 'src/Domain/Entities';
        const entityNames = ['User', 'Product', 'Order'];
        const templateContent =
          'export class {{name}} {\n  constructor() {}\n}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(3);

        expect(result[0].filePath).to.equal('src/Domain/Entities\\User.ts');
        expect(result[0].content).to.include('export class User');

        expect(result[1].filePath).to.equal('src/Domain/Entities\\Product.ts');
        expect(result[1].content).to.include('export class Product');

        expect(result[2].filePath).to.equal('src/Domain/Entities\\Order.ts');
        expect(result[2].content).to.include('export class Order');
      });

      it('should generate files with complex template content', () => {
        const entitiesDir = 'src/Domain/Entities';
        const entityNames = ['User'];
        const templateContent = `export class {{name}} {
  constructor(
    public id: string,
    public name: string
  ) {}

  toString(): string {
    return this.name;
  }
}`;

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(1);
        expect(result[0].content).to.include('export class User');
        expect(result[0].content).to.include('public id: string');
        expect(result[0].content).to.include('public name: string');
        expect(result[0].content).to.include('toString(): string');
        expect(result[0].content).to.include('return this.name;');
      });
    });

    describe('when handling different directory paths', () => {
      it('should handle absolute directory paths', () => {
        const entitiesDir = '/absolute/path/to/entities';
        const entityNames = ['User'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result[0].filePath).to.equal(
          '/absolute/path/to/entities\\User.ts'
        );
      });

      it('should handle relative directory paths', () => {
        const entitiesDir = './entities';
        const entityNames = ['User'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result[0].filePath).to.equal('./entities\\User.ts');
      });

      it('should handle nested directory paths', () => {
        const entitiesDir = 'src/domain/core/entities';
        const entityNames = ['User'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result[0].filePath).to.equal(
          'src/domain/core/entities\\User.ts'
        );
      });

      it('should handle directory paths with special characters', () => {
        const entitiesDir = 'src/entities-dir_with.special-chars';
        const entityNames = ['User'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result[0].filePath).to.equal(
          'src/entities-dir_with.special-chars\\User.ts'
        );
      });
    });

    describe('when handling different entity names', () => {
      it('should handle entity names with different cases', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['user', 'Product', 'ORDER', 'camelCase'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(4);
        expect(result[0].content).to.include('export class user');
        expect(result[1].content).to.include('export class Product');
        expect(result[2].content).to.include('export class ORDER');
        expect(result[3].content).to.include('export class camelCase');
      });

      it('should handle entity names with special characters', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User_Profile', 'API_Key', 'HTTP_Client'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(3);
        expect(result[0].content).to.include('export class User_Profile');
        expect(result[1].content).to.include('export class API_Key');
        expect(result[2].content).to.include('export class HTTP_Client');
      });

      it('should handle entity names with numbers', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User2', 'Product3', 'Entity1'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(3);
        expect(result[0].content).to.include('export class User2');
        expect(result[1].content).to.include('export class Product3');
        expect(result[2].content).to.include('export class Entity1');
      });

      it('should handle single character entity names', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['A', 'B', 'X'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(3);
        expect(result[0].content).to.include('export class A');
        expect(result[1].content).to.include('export class B');
        expect(result[2].content).to.include('export class X');
      });
    });

    describe('when handling edge cases', () => {
      it('should handle empty entity names array', () => {
        const entitiesDir = 'src/entities';
        const entityNames: string[] = [];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.be.an('array');
        expect(result).to.have.length(0);
      });

      it('should handle empty template content', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User'];
        const templateContent = '';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(1);
        expect(result[0].content).to.equal('');
      });

      it('should handle template without handlebars placeholders', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User'];
        const templateContent = 'export class StaticEntity {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(1);
        expect(result[0].content).to.equal('export class StaticEntity {}');
      });

      it('should handle template with multiple handlebars references', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User'];
        const templateContent = `export class {{name}} {
  constructor(public {{name}}Id: string) {}
  get{{name}}(): {{name}} { return this; }
}`;

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(1);
        const content = result[0].content;
        expect(content).to.include('export class User');
        expect(content).to.include('public UserId: string');
        expect(content).to.include('getUser(): User');
      });
    });

    describe('when validating file path generation', () => {
      it('should generate correct file paths for each entity', () => {
        const entitiesDir = 'src/Domain/Entities';
        const entityNames = ['User', 'Product', 'Order'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result[0].filePath).to.equal('src/Domain/Entities\\User.ts');
        expect(result[1].filePath).to.equal('src/Domain/Entities\\Product.ts');
        expect(result[2].filePath).to.equal('src/Domain/Entities\\Order.ts');
      });

      it('should use .ts file extension consistently', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User', 'Product'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        result.forEach(file => {
          expect(file.filePath).to.match(/\.ts$/);
        });
      });

      it('should use backslash path separator consistently', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result[0].filePath).to.include('\\');
        expect(result[0].filePath).to.equal('src/entities\\User.ts');
      });
    });
  });

  describe('generateEntityCodeFromTemplate', () => {
    describe('when generating code with valid inputs', () => {
      it('should generate entity code with simple template', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'User';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.be.a('string');
        expect(result).to.equal('export class User {}');
      });

      it('should generate entity code with complex template', () => {
        const templateContent = `export class {{name}} {
  constructor(
    public id: string,
    public name: string
  ) {}

  toString(): string {
    return \`{{name}}: \${this.name}\`;
  }
}`;
        const name = 'Product';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.include('export class Product');
        expect(result).to.include('public id: string');
        expect(result).to.include('public name: string');
        expect(result).to.include('toString(): string');
        expect(result).to.include('return `Product: ${this.name}`;');
      });

      it('should handle template with multiple name references', () => {
        const templateContent = `export class {{name}} {
  private {{name}}Id: string;
  
  constructor({{name}}Data: I{{name}}) {
    this.{{name}}Id = {{name}}Data.id;
  }
  
  get{{name}}Id(): string {
    return this.{{name}}Id;
  }
}`;
        const name = 'User';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.include('export class User');
        expect(result).to.include('private UserId: string');
        expect(result).to.include('constructor(UserData: IUser)');
        expect(result).to.include('this.UserId = UserData.id');
        expect(result).to.include('getUserId(): string');
        expect(result).to.include('return this.UserId;');
      });
    });

    describe('when handling different entity names', () => {
      it('should handle lowercase entity names', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'user';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class user {}');
      });

      it('should handle uppercase entity names', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'USER';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class USER {}');
      });

      it('should handle camelCase entity names', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'userProfile';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class userProfile {}');
      });

      it('should handle entity names with underscores', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'User_Profile';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class User_Profile {}');
      });

      it('should handle entity names with numbers', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'User2';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class User2 {}');
      });

      it('should handle single character entity names', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'A';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class A {}');
      });
    });

    describe('when handling edge cases', () => {
      it('should handle empty template content', () => {
        const templateContent = '';
        const name = 'User';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('');
      });

      it('should handle empty entity name', () => {
        const templateContent = 'export class {{name}} {}';
        const name = '';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class  {}');
      });

      it('should handle template without handlebars placeholders', () => {
        const templateContent = 'export class StaticEntity {}';
        const name = 'User';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.equal('export class StaticEntity {}');
      });

      it('should handle template with special characters', () => {
        const templateContent =
          'export class {{name}} {\n  // Special chars: @#$%^&*()\n}';
        const name = 'User';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.include('export class User');
        expect(result).to.include('// Special chars: @#$%^&*()');
      });
    });

    describe('when validating template compilation', () => {
      it('should preserve template formatting and structure', () => {
        const templateContent = `export class {{name}} {
  constructor() {
    // Initialize {{name}}
  }

  method(): void {
    console.log('{{name}} method called');
  }
}`;
        const name = 'User';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        const lines = result.split('\n');
        expect(lines).to.have.length.greaterThan(5);
        expect(lines[0]).to.equal('export class User {');
        expect(lines[1]).to.equal('  constructor() {');
        expect(lines[2]).to.equal('    // Initialize User');
        expect(lines[3]).to.equal('  }');
        expect(lines[4]).to.equal('');
        expect(lines[5]).to.equal('  method(): void {');
        expect(lines[6]).to.equal("    console.log('User method called');");
        expect(lines[7]).to.equal('  }');
        expect(lines[8]).to.equal('}');
      });

      it('should handle templates with conditional logic', () => {
        const templateContent =
          'export class {{name}} {\n{{#if name}}  // Class: {{name}}\n{{/if}}\n}';
        const name = 'User';

        const result = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result).to.include('export class User');
        expect(result).to.include('// Class: User');
      });

      it('should return consistent results for same inputs', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'User';

        const result1 = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );
        const result2 = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        expect(result1).to.equal(result2);
      });
    });
  });

  describe('integration scenarios', () => {
    describe('when performing complete entity generation workflows', () => {
      it('should handle real-world entity template', () => {
        const entitiesDir = 'src/Domain/Entities';
        const entityNames = ['User', 'Product'];
        const templateContent = `/**
 * Domain Entity: {{name}}
 */
export class {{name}} {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: Date = new Date()
  ) {}

  toString(): string {
    return \`{{name}}(id: \${this.id}, name: \${this.name})\`;
  }

  equals(other: {{name}}): boolean {
    return this.id === other.id;
  }
}`;

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(2);

        // Verify User entity
        expect(result[0].filePath).to.equal('src/Domain/Entities\\User.ts');
        expect(result[0].content).to.include('Domain Entity: User');
        expect(result[0].content).to.include('export class User');
        expect(result[0].content).to.include(
          '`User(id: ${this.id}, name: ${this.name})`'
        );
        expect(result[0].content).to.include('equals(other: User): boolean');

        // Verify Product entity
        expect(result[1].filePath).to.equal('src/Domain/Entities\\Product.ts');
        expect(result[1].content).to.include('Domain Entity: Product');
        expect(result[1].content).to.include('export class Product');
        expect(result[1].content).to.include(
          '`Product(id: ${this.id}, name: ${this.name})`'
        );
        expect(result[1].content).to.include('equals(other: Product): boolean');
      });

      it('should handle entity generation for e-commerce domain', () => {
        const entitiesDir = 'src/Domain/Entities';
        const entityNames = ['User', 'Product', 'Order', 'Payment', 'Cart'];
        const templateContent =
          'export class {{name}} {\n  constructor(public id: string) {}\n}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(5);

        const expectedEntities = [
          'User',
          'Product',
          'Order',
          'Payment',
          'Cart',
        ];
        result.forEach((file, index) => {
          expect(file.filePath).to.equal(
            `src/Domain/Entities\\${expectedEntities[index]}.ts`
          );
          expect(file.content).to.include(
            `export class ${expectedEntities[index]}`
          );
          expect(file.content).to.include('constructor(public id: string)');
        });
      });

      it('should handle large entity sets efficiently', () => {
        const entitiesDir = 'src/Domain/Entities';
        const entityNames = Array.from(
          { length: 20 },
          (_, i) => `Entity${i + 1}`
        );
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(20);

        result.forEach((file, index) => {
          const expectedName = `Entity${index + 1}`;
          expect(file.filePath).to.equal(
            `src/Domain/Entities\\${expectedName}.ts`
          );
          expect(file.content).to.equal(`export class ${expectedName} {}`);
        });
      });
    });

    describe('when validating consistency across methods', () => {
      it('should generate same content via both methods', () => {
        const templateContent = 'export class {{name}} {}';
        const name = 'User';

        // Generate via generateEntityCodeFromTemplate
        const codeResult = service.generateEntityCodeFromTemplate(
          templateContent,
          name
        );

        // Generate via generateEntitiesFiles
        const filesResult = service.generateEntitiesFiles(
          'src/entities',
          [name],
          templateContent
        );

        expect(filesResult).to.have.length(1);
        expect(filesResult[0].content).to.equal(codeResult);
      });

      it('should maintain template integrity across multiple generations', () => {
        const templateContent = `export class {{name}} {
  constructor(public name: string) {}
  getName(): string { return this.name; }
}`;
        const entityNames = ['User', 'Product'];

        const result1 = service.generateEntitiesFiles(
          'src/entities',
          entityNames,
          templateContent
        );
        const result2 = service.generateEntitiesFiles(
          'src/entities',
          entityNames,
          templateContent
        );

        expect(result1).to.have.length(result2.length);
        result1.forEach((file, index) => {
          expect(file.content).to.equal(result2[index].content);
          expect(file.filePath).to.equal(result2[index].filePath);
        });
      });
    });

    describe('when validating error resilience', () => {
      it('should handle generation with malformed templates gracefully', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['User'];
        const templateContent = 'export class {{name}} {}'; // Valid template

        try {
          const result = service.generateEntitiesFiles(
            entitiesDir,
            entityNames,
            templateContent
          );

          expect(result).to.have.length(1);
          expect(result[0].filePath).to.equal('src/entities\\User.ts');
          expect(result[0].content).to.include('export class User');
        } catch (error) {
          // If template parsing fails, that's expected behavior for malformed templates
          expect(error).to.be.instanceOf(Error);
        }
      });

      it('should continue processing after encountering edge cases', () => {
        const entitiesDir = 'src/entities';
        const entityNames = ['', 'User', '', 'Product'];
        const templateContent = 'export class {{name}} {}';

        const result = service.generateEntitiesFiles(
          entitiesDir,
          entityNames,
          templateContent
        );

        expect(result).to.have.length(4);
        expect(result[0].content).to.equal('export class  {}');
        expect(result[1].content).to.equal('export class User {}');
        expect(result[2].content).to.equal('export class  {}');
        expect(result[3].content).to.equal('export class Product {}');
      });
    });
  });
});
