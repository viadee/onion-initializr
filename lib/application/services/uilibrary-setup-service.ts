import { FileService } from "../../Domain/Services/file-service";
import { PathAppService } from "./path-app-service";
import { ICommandRunner } from "../../Domain/Interfaces/icommand-runner";
import { UiLibrary } from "../../Domain/Entities/ui-library";
import Handlebars from "handlebars";

/**
 * Shared service for setting up UI libraries (ShadCN, etc.)
 * Used by both CLI and WebContainer implementations
 */
export class UILibrarySetupService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}

  /**
   * Setup UI Library specific packages and configuration
   */
  async setupUILibrary(
    folderPath: string,
    uiLibrary: UiLibrary,
    commandRunner: ICommandRunner
  ): Promise<void> {
			console.log("TCL: UILibrarySetupService -> uiLibrary", uiLibrary)
    
    if (uiLibrary === "none") {
      return;
    }

    if (uiLibrary === "shadcn") {
      await this.setupShadCN(folderPath, commandRunner);
    } else {
      console.log(`⚠️ UI library ${uiLibrary} not yet implemented`);
    }
  }

  /**
   * Setup ShadCN/UI library
   */
  private async setupShadCN(
    folderPath: string,
    commandRunner: ICommandRunner
  ): Promise<void> {
    console.log("Installing ShadCN/UI dependencies...");

    // Install core ShadCN dependencies
    await commandRunner.runCommand(
      "npm install class-variance-authority clsx tailwind-merge",
      folderPath
    );

    // Install Tailwind CSS and related packages
    await commandRunner.runCommand(
      "npm install -D tailwindcss postcss autoprefixer @tailwindcss/typography @tailwindcss/vite @tailwindcss/postcss tailwindcss-cli",
      folderPath
    );

    // Install Radix UI components commonly used with ShadCN
    await commandRunner.runCommand(
      "npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu",
      folderPath
    );

    // ShadCN expects a path alias
    await this.addCompilerOptionsToTsConfig(folderPath);

    // Create tailwind.config.js
    await commandRunner.runCommand(
      "npx tailwindcss-cli@latest init -p",
      folderPath
    );

    // ShadCN expects a minimal index.css
    await this.createIndexCss(folderPath);

    await commandRunner.runCommand(
      "npx shadcn@latest init -y --base-color neutral",
      folderPath
    );

    // The shadcn command adds weird css directives to index.css, we don't want -> we overwrite the index.css again
    await this.createIndexCss(folderPath);

    await commandRunner.runCommand(
      "npx shadcn@latest add button -y",
      folderPath
    );

    // Setup configuration files
    await this.createPostCssConfig(folderPath);
    await this.createTailwindConfig(folderPath);
    await this.createViteConfig(folderPath);

    // Replace App.tsx with ShadCN-specific version
    await this.replaceAppWithShadCNVersion(folderPath);

    console.log("✅ ShadCN setup completed!");
  }

  /**
   * Create index.css from template
   */
  private async createIndexCss(folderPath: string): Promise<void> {
    const indexCssPath = this.pathService.join(
      folderPath,
      "src",
      "index.css"
    );
    const indexCssTemplate = await this.fileService.readTemplate(
      "infrastructure/frameworks/templates/react/shadcn/index.css.hbs"
    );

    await this.fileService.createFile({
      filePath: indexCssPath,
      content: indexCssTemplate.content,
    });
  }

  /**
   * Create PostCSS configuration from template
   */
  private async createPostCssConfig(folderPath: string): Promise<void> {
    const postcssConfigPath = this.pathService.join(
      folderPath,
      "postcss.config.js"
    );
    const newPostcssConfigPath = this.pathService.join(
      folderPath,
      "postcss.config.cjs"
    );

    // Only rename if the original file exists
    if (await this.fileService.fileExists(postcssConfigPath)) {
      this.fileService.rename(postcssConfigPath, newPostcssConfigPath);
    }

    const postcssTemplate = await this.fileService.readTemplate(
      "infrastructure/frameworks/templates/react/shadcn/postcss.config.cjs.hbs"
    );

    await this.fileService.createFile({
      filePath: newPostcssConfigPath,
      content: postcssTemplate.content,
    });
  }

  /**
   * Create Tailwind configuration from template
   */
  private async createTailwindConfig(folderPath: string): Promise<void> {
    const tailwindConfigPath = this.pathService.join(
      folderPath,
      "tailwind.config.js"
    );
    const tailwindTemplate = await this.fileService.readTemplate(
      "infrastructure/frameworks/templates/react/shadcn/tailwind.config.js.hbs"
    );
    await this.fileService.createFile({
      filePath: tailwindConfigPath,
      content: tailwindTemplate.content,
    });
  }

  /**
   * Create Vite configuration from template
   */
  private async createViteConfig(folderPath: string): Promise<void> {
    const viteConfigPath = this.pathService.join(
      folderPath,
      "vite.config.ts"
    );
    const viteTemplate = await this.fileService.readTemplate(
      "infrastructure/frameworks/templates/react/shadcn/vite.config.ts.hbs"
    );
    await this.fileService.createFile({
      filePath: viteConfigPath,
      content: viteTemplate.content,
    });
  }

  /**
   * Replace App.tsx with ShadCN-specific version
   */
  private async replaceAppWithShadCNVersion(folderPath: string): Promise<void> {
    const appShadcnTemplatePath =
      "infrastructure/frameworks/templates/react/shadcn/App-shadcn.tsx.hbs";
    const appShadcnTemplate =
      await this.fileService.readTemplate(appShadcnTemplatePath);

    // Compile the template with Handlebars (no firstAppService at this stage)
    const compiled = Handlebars.compile(appShadcnTemplate.content);
    const renderedAppContent = compiled({});

    const appTsxPath = this.pathService.join(
      folderPath,
      "src",
      "infrastructure",
      "presentation",
      "App.tsx"
    );

    await this.fileService.createFile({
      filePath: appTsxPath,
      content: renderedAppContent,
    });

    console.log("✓ Replaced App.tsx with ShadCN version");
  }

  /**
   * Add TypeScript compiler options for path aliases
   */
  async addCompilerOptionsToTsConfig(folderPath: string): Promise<void> {
    // Find the appropriate tsconfig file
    const configPaths = [
      this.pathService.join(folderPath, "tsconfig.json"),
      this.pathService.join(folderPath, "tsconfig.app.json"),
    ];

    let configPath: string | null = null;
    for (const path of configPaths) {
      if (await this.fileService.fileExists(path)) {
        configPath = path;
        break;
      }
    }

    if (!configPath) {
      console.warn(
        "No tsconfig.json file found, skipping compiler options update"
      );
      return;
    }

    try {
      const configFile = await this.fileService.readFile(configPath);
      const cleanContent = this.removeJsonComments(configFile.content);
      const configContent = JSON.parse(cleanContent);

      // Add baseUrl and paths configuration
      configContent.compilerOptions = {
        ...configContent.compilerOptions,
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
          ...(configContent.compilerOptions?.paths || {}),
        },
      };

      await this.fileService.createFile({
        filePath: configPath,
        content: JSON.stringify(configContent, null, 2),
      });

      console.log("✓ Added compiler options (baseUrl and paths) to tsconfig");
    } catch (error) {
      console.error("Failed to update tsconfig.json:", error);
    }
  }

  /**
   * Remove JSON comments from content
   */
  private removeJsonComments(content: string): string {
    return content
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return (
          !trimmed.startsWith("/*") &&
          !trimmed.startsWith("//") &&
          !trimmed.startsWith("*/")
        );
      })
      .join("\n");
  }
}
