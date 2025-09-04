import { expect } from 'chai';
import { IRepoService } from '../../../Domain/Services/IRepoService';
import { FileEntity } from '../../../Domain/Entities/FileEntity';

describe('IRepoService', () => {
  let service: IRepoService;

  beforeEach(() => {
    service = new IRepoService();
  });

  describe('generateRepositoryInterfacesFiles', () => {
    const mockTemplateContent = `import { {{entityName}} } from "../Entities/{{entityName}}";
/**
 * Repository Interface: I{{entityName}}Repository
*/
export interface I{{entityName}}Repository {
    findAll(): Promise<{{{entityName}}}[] | null>;
    findById(id: string): Promise<{{entityName}} | null>;
    save(entity: {{entityName}}): Promise<void>;
    delete(id: string): Promise<void>;

    // TODO: Add more custom methods if needed
}`;

    it('should generate correct file paths for repository interfaces', () => {
      const entityFilePaths = [
        {
          entityName: 'User',
          filePath: 'src/Domain/Interfaces/IUserRepository.ts',
        },
        {
          entityName: 'Product',
          filePath: 'src/Domain/Interfaces/IProductRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      expect(result).to.have.lengthOf(2);
      expect(result[0].filePath).to.equal(
        'src/Domain/Interfaces/IUserRepository.ts'
      );
      expect(result[1].filePath).to.equal(
        'src/Domain/Interfaces/IProductRepository.ts'
      );
    });

    it('should return FileEntity instances with correct structure', () => {
      const entityFilePaths = [
        {
          entityName: 'Order',
          filePath: 'src/Domain/Interfaces/IOrderRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      expect(result[0]).to.be.instanceOf(FileEntity);
      expect(result[0].filePath).to.be.a('string');
      expect(result[0].content).to.be.a('string');
    });

    it('should generate correct interface names and imports', () => {
      const entityFilePaths = [
        {
          entityName: 'Customer',
          filePath: 'src/Domain/Interfaces/ICustomerRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'import { Customer } from "../Entities/Customer";'
      );
      expect(generatedCode).to.include('export interface ICustomerRepository');
      expect(generatedCode).to.include(
        'findById(id: string): Promise<Customer | null>'
      );
      expect(generatedCode).to.include('findAll(): Promise<Customer[] | null>');
      expect(generatedCode).to.include('save(entity: Customer): Promise<void>');
      expect(generatedCode).to.include('delete(id: string): Promise<void>');
    });

    it('should handle multiple entities correctly', () => {
      const entityFilePaths = [
        {
          entityName: 'User',
          filePath: 'src/Domain/Interfaces/IUserRepository.ts',
        },
        {
          entityName: 'Product',
          filePath: 'src/Domain/Interfaces/IProductRepository.ts',
        },
        {
          entityName: 'Order',
          filePath: 'src/Domain/Interfaces/IOrderRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      expect(result).to.have.lengthOf(3);

      const filePaths = result.map(file => file.filePath);
      expect(filePaths).to.include('src/Domain/Interfaces/IUserRepository.ts');
      expect(filePaths).to.include(
        'src/Domain/Interfaces/IProductRepository.ts'
      );
      expect(filePaths).to.include('src/Domain/Interfaces/IOrderRepository.ts');

      // Check that each interface has the correct entity name
      const userInterface = result.find(f =>
        f.filePath.includes('IUserRepository')
      );
      const productInterface = result.find(f =>
        f.filePath.includes('IProductRepository')
      );
      const orderInterface = result.find(f =>
        f.filePath.includes('IOrderRepository')
      );

      expect(userInterface?.content).to.include(
        'export interface IUserRepository'
      );
      expect(userInterface?.content).to.include('Promise<User[] | null>');

      expect(productInterface?.content).to.include(
        'export interface IProductRepository'
      );
      expect(productInterface?.content).to.include('Promise<Product[] | null>');

      expect(orderInterface?.content).to.include(
        'export interface IOrderRepository'
      );
      expect(orderInterface?.content).to.include('Promise<Order[] | null>');
    });

    it('should handle empty entity list gracefully', () => {
      const entityFilePaths: Array<{ entityName: string; filePath: string }> =
        [];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(0);
    });

    it('should handle entities with special characters in names', () => {
      const entityFilePaths = [
        {
          entityName: 'User_Profile',
          filePath: 'src/Domain/Interfaces/IUser_ProfileRepository.ts',
        },
        {
          entityName: 'Product-Item',
          filePath: 'src/Domain/Interfaces/IProduct-ItemRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      expect(result).to.have.lengthOf(2);
      expect(result[0].filePath).to.equal(
        'src/Domain/Interfaces/IUser_ProfileRepository.ts'
      );
      expect(result[1].filePath).to.equal(
        'src/Domain/Interfaces/IProduct-ItemRepository.ts'
      );

      expect(result[0].content).to.include(
        'export interface IUser_ProfileRepository'
      );
      expect(result[1].content).to.include(
        'export interface IProduct-ItemRepository'
      );
    });

    it('should handle entities with numeric characters', () => {
      const entityFilePaths = [
        {
          entityName: 'User2',
          filePath: 'src/Domain/Interfaces/IUser2Repository.ts',
        },
        {
          entityName: 'Product123',
          filePath: 'src/Domain/Interfaces/IProduct123Repository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      expect(result).to.have.lengthOf(2);
      const generatedCode1 = result[0].content;
      const generatedCode2 = result[1].content;

      expect(generatedCode1).to.include('export interface IUser2Repository');
      expect(generatedCode1).to.include('Promise<User2[] | null>');

      expect(generatedCode2).to.include(
        'export interface IProduct123Repository'
      );
      expect(generatedCode2).to.include('Promise<Product123[] | null>');
    });

    it('should handle different directory paths correctly', () => {
      const entityFilePaths = [
        {
          entityName: 'User',
          filePath: 'custom/path/to/interfaces/IUserRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        mockTemplateContent
      );

      expect(result[0].filePath).to.equal(
        'custom/path/to/interfaces/IUserRepository.ts'
      );
    });

    it('should use save method correctly', () => {
      const templateWithSave = `
export interface I{{entityName}}Repository {
  save(entity: {{entityName}}): Promise<void>;
  update{{entityName}}(entity: {{entityName}}): Promise<void>;
}`;

      const entityFilePaths = [
        {
          entityName: 'UserProfile',
          filePath: 'src/Domain/Interfaces/IUserProfileRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        templateWithSave
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'save(entity: UserProfile): Promise<void>'
      );
      expect(generatedCode).to.include(
        'updateUserProfile(entity: UserProfile): Promise<void>'
      );
    });

    it('should preserve template structure and formatting', () => {
      const formattedTemplate = `import { {{entityName}} } from "../Entities/{{entityName}}";

/**
 * Repository interface for {{entityName}} entity
 */
export interface I{{entityName}}Repository {
  /**
   * Find {{entityName}} by ID
   */
  findById(id: string): Promise<{{entityName}} | null>;
  
  /**
   * Get all {{entityName}} entities
   */
  findAll(): Promise<{{entityName}}[]>;
}`;

      const entityFilePaths = [
        {
          entityName: 'User',
          filePath: 'src/Domain/Interfaces/IUserRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        formattedTemplate
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include(
        'import { User } from "../Entities/User";'
      );
      expect(generatedCode).to.include(
        '* Repository interface for User entity'
      );
      expect(generatedCode).to.include('export interface IUserRepository {');
      expect(generatedCode).to.include('* Find User by ID');
      expect(generatedCode).to.include('* Get all User entities');
    });

    it('should handle complex template with actual repository structure', () => {
      const actualTemplate = `import { {{entityName}} } from "../Entities/{{entityName}}";
/**
 * Repository Interface: I{{entityName}}Repository
*/
export interface I{{entityName}}Repository {
    findAll(): Promise<{{{entityName}}}[] | null>;
    findById(id: string): Promise<{{entityName}} | null>;
    save(entity: {{entityName}}): Promise<void>;
    delete(id: string): Promise<void>;

    // TODO: Add more custom methods if needed
}`;

      const entityFilePaths = [
        {
          entityName: 'Product',
          filePath: 'src/Domain/Interfaces/IProductRepository.ts',
        },
      ];

      const result = service.generateRepositoryInterfacesFiles(
        entityFilePaths,
        actualTemplate
      );

      const generatedCode = result[0].content;
      expect(generatedCode).to.include('export interface IProductRepository');
      expect(generatedCode).to.include('save(entity: Product): Promise<void>');
      expect(generatedCode).to.include('findAll(): Promise<Product[] | null>');
      expect(generatedCode).to.include(
        'findById(id: string): Promise<Product | null>'
      );
      expect(generatedCode).to.include('delete(id: string): Promise<void>');
      expect(generatedCode).to.include(
        '// TODO: Add more custom methods if needed'
      );
    });
  });

  describe('generateRepositoryInterfaceCode', () => {
    const simpleTemplate = `
export interface I{{entityName}}Repository {
  entityName: "{{entityName}}";
  lowerCaseName: "{{lowerFirst entityName}}";
}`;

    it('should generate code with correct entity name', () => {
      const result = service.generateRepositoryInterfaceCode(
        simpleTemplate,
        'User'
      );

      expect(result).to.include('export interface IUserRepository');
      expect(result).to.include('entityName: "User"');
    });

    it('should handle lowerFirst helper correctly', () => {
      const result = service.generateRepositoryInterfaceCode(
        simpleTemplate,
        'UserProfile'
      );

      expect(result).to.include('lowerCaseName: "userProfile"');
    });

    it('should handle empty entity name gracefully', () => {
      const result = service.generateRepositoryInterfaceCode(
        simpleTemplate,
        ''
      );

      expect(result).to.include('export interface IRepository');
      expect(result).to.include('entityName: ""');
      expect(result).to.include('lowerCaseName: ""');
    });

    it('should handle single character entity name', () => {
      const result = service.generateRepositoryInterfaceCode(
        simpleTemplate,
        'A'
      );

      expect(result).to.include('export interface IARepository');
      expect(result).to.include('entityName: "A"');
      expect(result).to.include('lowerCaseName: "a"');
    });

    it('should compile templates without helpers', () => {
      const basicTemplate = `
export interface I{{entityName}}Repository {
  readonly entityType: "{{entityName}}";
}`;

      const result = service.generateRepositoryInterfaceCode(
        basicTemplate,
        'Customer'
      );

      expect(result).to.include('export interface ICustomerRepository');
      expect(result).to.include('readonly entityType: "Customer"');
    });

    it('should handle templates with multiple entity name references', () => {
      const multiRefTemplate = `export interface I{{entityName}}Repository {
  // Standard methods
  findAll(): Promise<{{{entityName}}}[] | null>;
  findById(id: string): Promise<{{entityName}} | null>;
  save(entity: {{entityName}}): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Custom methods with entity name
  find{{entityName}}ById(id: string): Promise<{{entityName}} | null>;
  save{{entityName}}(entity: {{entityName}}): Promise<void>;
}`;

      const result = service.generateRepositoryInterfaceCode(
        multiRefTemplate,
        'Order'
      );

      expect(result).to.include('findAll(): Promise<Order[] | null>');
      expect(result).to.include('save(entity: Order): Promise<void>');
      expect(result).to.include(
        'findOrderById(id: string): Promise<Order | null>'
      );
      expect(result).to.include('saveOrder(entity: Order): Promise<void>');
    });

    it('should handle templates with actual repository structure', () => {
      const actualTemplate = `import { {{entityName}} } from "../Entities/{{entityName}}";
/**
 * Repository Interface: I{{entityName}}Repository
*/
export interface I{{entityName}}Repository {
    findAll(): Promise<{{{entityName}}}[] | null>;
    findById(id: string): Promise<{{entityName}} | null>;
    save(entity: {{entityName}}): Promise<void>;
    delete(id: string): Promise<void>;

    // TODO: Add more custom methods if needed
}`;

      const result = service.generateRepositoryInterfaceCode(
        actualTemplate,
        'Document'
      );

      expect(result).to.include('export interface IDocumentRepository');
      expect(result).to.include('findAll(): Promise<Document[] | null>');
      expect(result).to.include('save(entity: Document): Promise<void>');
      expect(result).to.include('delete(id: string): Promise<void>');
    });

    it('should handle template with custom methods', () => {
      const customTemplate = `import { {{entityName}} } from "../Entities/{{entityName}}";

export interface I{{entityName}}Repository {
  // Basic operations from actual template
  findAll(): Promise<{{{entityName}}}[] | null>;
  findById(id: string): Promise<{{entityName}} | null>;
  save(entity: {{entityName}}): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Custom methods for {{entityName}}
  findBy{{entityName}}Name(name: string): Promise<{{entityName}}[]>;
  count{{entityName}}s(): Promise<number>;
}`;

      const result = service.generateRepositoryInterfaceCode(
        customTemplate,
        'Invoice'
      );

      expect(result).to.include(
        'import { Invoice } from "../Entities/Invoice";'
      );
      expect(result).to.include('export interface IInvoiceRepository');
      expect(result).to.include('findAll(): Promise<Invoice[] | null>');
      expect(result).to.include('save(entity: Invoice): Promise<void>');
      expect(result).to.include(
        'findByInvoiceName(name: string): Promise<Invoice[]>'
      );
      expect(result).to.include('countInvoices(): Promise<number>');
    });
  });
});
