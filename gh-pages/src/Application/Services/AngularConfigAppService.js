"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularConfigAppService = void 0;
const FileEntity_1 = require("../../Domain/Entities/FileEntity");
const TemplateService_1 = require("../../Domain/Services/TemplateService");
class AngularConfigAppService {
    constructor(fileService, pathService) {
        this.fileService = fileService;
        this.pathService = pathService;
    }
    async generateAngularProvidersFiles(folderPath, entityNames, domainServiceNames, applicationServiceNames, applicationServiceDependencies) {
        const providers = this.buildProviderConfig(entityNames, domainServiceNames, applicationServiceNames, applicationServiceDependencies);
        const fileEntities = [];
        const providersFile = await this.generateProvidersFile(folderPath, providers);
        fileEntities.push(providersFile);
        const appConfigFile = await this.generateAppConfigFile(folderPath);
        fileEntities.push(appConfigFile);
        return fileEntities;
    }
    buildProviderConfig(entityNames, domainServiceNames, applicationServiceNames, applicationServiceDependencies) {
        const providers = [];
        // Add repository providers
        entityNames.forEach(entityName => {
            const repoName = `${entityName}Repository`;
            const interfaceName = `I${entityName}Repository`;
            providers.push({
                provide: interfaceName,
                useClass: repoName,
            });
        });
        // Add domain service providers
        domainServiceNames.forEach(serviceName => {
            providers.push({
                provide: serviceName,
                useClass: serviceName,
            });
        });
        // Add application service providers with dependencies
        applicationServiceNames.forEach(appServiceName => {
            const deps = applicationServiceDependencies[appServiceName];
            if (deps) {
                const dependencies = [
                    ...(deps.domainServices || []),
                    ...(deps.repositories || []),
                ];
                providers.push({
                    provide: appServiceName,
                    useClass: appServiceName,
                    deps: dependencies.length > 0 ? dependencies : undefined,
                });
            }
            else {
                providers.push({
                    provide: appServiceName,
                    useClass: appServiceName,
                });
            }
        });
        return providers;
    }
    async generateProvidersFile(folderPath, providers) {
        const imports = this.generateImports(providers);
        const templatePath = this.pathService.join('Infrastructure', 'frameworks', 'templates', 'angular', 'di-providers.ts.hbs');
        const template = await this.fileService.readTemplate(templatePath);
        const generator = new TemplateService_1.TemplateService(template.content);
        const content = generator.render({
            imports: imports,
            providers: providers,
        });
        const appDir = this.pathService.join(folderPath, 'src', 'app');
        if (!(await this.fileService.dirExists(appDir))) {
            await this.fileService.createDirectory(appDir);
        }
        const filePath = this.pathService.join(folderPath, 'src', 'Infrastructure', 'Presentation', 'di-providers.ts');
        const file = new FileEntity_1.FileEntity(filePath, content);
        return file;
    }
    async generateAppConfigFile(folderPath) {
        const templatePath = this.pathService.join('Infrastructure', 'frameworks', 'templates', 'angular', 'app.config.ts.hbs');
        const template = await this.fileService.readTemplate(templatePath);
        const generator = new TemplateService_1.TemplateService(template.content);
        const content = generator.render({});
        const appDir = this.pathService.join(folderPath);
        if (!(await this.fileService.dirExists(appDir))) {
            await this.fileService.createDirectory(appDir);
        }
        const filePath = this.pathService.join(folderPath, 'src', 'Infrastructure', 'Presentation', 'app.config.ts');
        const file = new FileEntity_1.FileEntity(filePath, content);
        return file;
    }
    generateImports(providers) {
        const imports = new Set();
        providers.forEach(provider => {
            const importStatements = this.createImportStatements(provider.useClass);
            importStatements.forEach(statement => imports.add(statement));
        });
        return Array.from(imports);
    }
    createImportStatements(className) {
        if (this.isRepository(className)) {
            return this.createRepositoryImports(className);
        }
        if (this.isDomainService(className)) {
            return this.createDomainServiceImports(className);
        }
        if (this.isAppService(className)) {
            return this.createAppServiceImports(className);
        }
        return [];
    }
    isRepository(className) {
        return className.endsWith('Repository');
    }
    isDomainService(className) {
        return className.endsWith('Service') && !className.endsWith('AppService');
    }
    isAppService(className) {
        return className.endsWith('AppService');
    }
    createRepositoryImports(className) {
        const entityName = className.replace('Repository', '');
        return [
            `import { ${className} } from '../../Infrastructure/Repositories/${className}';`,
            `import { I${entityName}Repository } from '../../Domain/Interfaces/I${entityName}Repository';`,
        ];
    }
    createDomainServiceImports(className) {
        return [
            `import { ${className} } from '../../Domain/Services/${className}';`,
        ];
    }
    createAppServiceImports(className) {
        return [
            `import { ${className} } from '../../Application/Services/${className}';`,
        ];
    }
}
exports.AngularConfigAppService = AngularConfigAppService;
