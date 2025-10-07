import { FileService } from "../../../../lib/Domain/Services/FileService";
import { PathAppService } from "../../../../lib/Application/Services/PathAppService";
import { DiFramework } from "../../../../lib/Domain/Entities/DiFramework";
import { UiLibrary } from "../../../../lib/Domain/Entities/UiLibrary";
import { OnionConfig } from "../../../../lib/Domain/Entities/OnionConfig";
import { UIFrameworks } from "../../../../lib/Domain/Entities/UiFramework";

// This Scanner allows you to create a JSON File
// with in the CLI based on the project you are
// in by using onion --scan <folderPath> <outputFileName.json>
export class ScannerAppService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}

  async scanOnionProject(folderPath: string): Promise<OnionConfig> {
    const src = this.pathService.join(folderPath, "src");

    const entitiesDir = this.pathService.join(src, "Domain", "Entities");
    const servicesDir = this.pathService.join(src, "Domain", "Services");
    const appServicesDir = this.pathService.join(
      src,
      "Application",
      "Services"
    );

    const entities = await this.fileService.getNamesFromDir(entitiesDir);
    const domainServices = await this.fileService.getNamesFromDir(servicesDir);

    const applicationServices =
      await this.fileService.getNamesFromDir(appServicesDir);

    const domainServiceConnections = await this.scanServiceDependencies(
      servicesDir,
      entities
    );
    const applicationServiceDependencies =
      await this.scanAppServiceDependencies(appServicesDir);

    const uiFramework = await this.detectUIFramework(folderPath);
    const diFramework = await this.detectDiFramework(folderPath);
    const uiLibrary = await this.detectUiLibrary(folderPath);
    return {
      folderPath,
      entities,
      domainServices,
      applicationServices,
      domainServiceConnections,
      applicationServiceDependencies,
      uiFramework,
      diFramework,
      uiLibrary,
    };
  }

  private async scanServiceDependencies(
    dir: string,
    knownEntities: string[]
  ): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};
    if (!(await this.fileService.dirExists(dir))) {
      return result;
    }

    const files = await this.fileService.readdir(dir);
    for (const fileName of files) {
      // Skip directories and non-TypeScript files
      if (!fileName.endsWith(".ts")) {
        console.log(
          "⏭️ scanServiceDependencies: Skipping non-TS file/directory:",
          fileName
        );
        continue;
      }

      const filePath = this.pathService.join(dir, fileName);
      const file = await this.fileService.readFile(filePath);

      const serviceName = this.pathService.basename(fileName, ".ts");
      const injected: string[] = [];

      for (const entity of knownEntities) {
        // Improved regex to handle multi-line constructor parameters and proper spacing
        const regex = new RegExp(
          `private\\s+readonly\\s+\\w+\\s*:\\s*${entity}(?![\\w])`,
          "gm"
        );
        if (regex.test(file.content)) {
          injected.push(entity);
          console.log(`🔗 Found dependency: ${serviceName} -> ${entity}`);
        }
      }

      result[serviceName] = injected;
    }

    return result;
  }

  private async scanAppServiceDependencies(
    dir: string
  ): Promise<
    Record<string, { domainServices: string[]; repositories: string[] }>
  > {
    console.log("🔍 scanAppServiceDependencies: Checking dir:", dir);
    const result: Record<
      string,
      { domainServices: string[]; repositories: string[] }
    > = {};
    if (!(await this.fileService.dirExists(dir))) {
      console.log(
        "❌ scanAppServiceDependencies: Directory does not exist:",
        dir
      );
      return result;
    }

    const files = await this.fileService.readdir(dir);

    for (const fileName of files) {
      // Skip directories and non-TypeScript files
      if (!fileName.endsWith(".ts")) {
        console.log(
          "⏭️ scanAppServiceDependencies: Skipping non-TS file/directory:",
          fileName
        );
        continue;
      }

      const filePath = this.pathService.join(dir, fileName);

      const file = await this.fileService.readFile(filePath);

      const serviceName = this.pathService.basename(fileName, ".ts");
      const dependencies = this.extractServiceDependencies(
        file.content,
        serviceName
      );
      result[serviceName] = dependencies;
    }

    return result;
  }

  private extractServiceDependencies(
    fileContent: string,
    serviceName: string
  ): { domainServices: string[]; repositories: string[] } {
    const domainServices: string[] = [];
    const repositories: string[] = [];

    const constructorRegex = /constructor\s*\([^)]*\)/gs;
    const constructorMatch = fileContent.match(constructorRegex);
    if (constructorMatch) {
      const constructorContent = constructorMatch[0];
      const paramRegex =
        /private\s+readonly\s+(\w+)\s*:\s*([A-Za-z_][\w<>[\]]*)/g;
      let paramMatch;

      while ((paramMatch = paramRegex.exec(constructorContent)) !== null) {
        const [, paramName, typeName] = paramMatch;
        console.log(`📋 Parameter found: ${paramName}: ${typeName}`);

        if (typeName.endsWith("Service")) {
          domainServices.push(typeName);
          console.log(
            `🔗 Domain service dependency: ${serviceName} -> ${typeName}`
          );
        }
        if (typeName.startsWith("I") && typeName.endsWith("Repository")) {
          repositories.push(typeName);
          console.log(
            `🗃️ Repository dependency: ${serviceName} -> ${typeName}`
          );
        }
      }
    } else {
      console.log(`❌ No constructor found for ${serviceName}`);
    }

    return { domainServices, repositories };
  }

  private async detectUIFramework(
    dir: string
  ): Promise<keyof UIFrameworks | undefined> {
    const pkgPath = this.pathService.join(dir, "package.json");

    if (!(await this.fileService.fileExists(pkgPath))) {
      console.log(
        "❌ detectUIFramework: package.json does not exist at:",
        pkgPath
      );
      return;
    }

    const file = await this.fileService.readFile(pkgPath);
    const content = file.content;
    const pkg = JSON.parse(content);

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if ("react" in deps || "react-dom" in deps) return "react";
    if ("vue" in deps) return "vue";
    if ("@angular/core" in deps) return "angular";
    if ("lit" in deps || "lit-element" in deps) return "lit";

    return "vanilla";
  }
  private async detectDiFramework(
    folderPath: string
  ): Promise<DiFramework | undefined> {
    const pkgPath = this.pathService.join(folderPath, "package.json");

    if (!(await this.fileService.fileExists(pkgPath))) {
      return undefined;
    }

    const file = await this.fileService.readFile(pkgPath);
    const pkg = JSON.parse(file.content);

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if ("awilix" in deps) return "awilix";
    // Order matters here:
    // If awilix is not found, assume angular Dependency is not just for the frontend, but also for DI
    if ("@angular/core" in deps) return "angular";
    return undefined;
  }

  private async detectUiLibrary(
    folderPath: string
  ): Promise<UiLibrary | undefined> {
    const pkgPath = this.pathService.join(folderPath, "package.json");

    if (!(await this.fileService.fileExists(pkgPath))) {
      return undefined;
    }

    const file = await this.fileService.readFile(pkgPath);
    const pkg = JSON.parse(file.content);

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Check for ShadeCN/UI components
    if (
      "@radix-ui/react-slot" in deps ||
      "class-variance-authority" in deps ||
      "clsx" in deps ||
      "tailwind-merge" in deps
    ) {
      return "shadcn";
    }
    // Check for Material-UI (not yet supported, so return none)
    if ("@mui/material" in deps || "@material-ui/core" in deps) {
      return "none"; // Will be supported in future
    }
    // Check for Ant Design (not yet supported, so return none)
    if ("antd" in deps) {
      return "none"; // Will be supported in future
    }

    return "none";
  }
}
