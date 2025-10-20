import { FileEntity } from "../Entities/file-entity";
import { ShowcaseAppGeneration } from "../Entities/showcase-app-generation";
import { UIFrameworks } from "../Entities/ui-framework";
import { UiLibrary } from "../Entities/ui-library";
import { FileService } from "./file-service";
import Handlebars from "handlebars";
import { ShowcaseTemplateFile } from "../Entities/showcase-template-file";
interface TemplateContext {
  firstAppService?: string;
  useAngularDI?: boolean;
}

interface TemplateFileDefinition {
  templatePath: string;
  outputPath: string;
}

type PathBuilder = (
  template: string,
  output: string
) => {
  templatePath: string;
  outputPath: string;
};

type SupportedFramework = Exclude<keyof UIFrameworks, "vanilla">;

export class ShowcaseService {
  constructor(private readonly fileService: FileService) {}

  async generateShowcaseFiles(
    request: ShowcaseAppGeneration,
    buildPaths: PathBuilder
  ): Promise<FileEntity[]> {
    if (request.framework === "vanilla") {
      console.log("Vanilla framework selected, skipping generation.");
      return [];
    }

    const templateFiles = this.getTemplateFilesForFramework(request.framework, request.uiLibrary);
    if (templateFiles.main.length === 0) {
      return [];
    }

    const context: TemplateContext = {
      firstAppService: request.firstAppService,
      useAngularDI: request.useAngularDI,
    };

    const mainFiles = this.buildFileDefinitions(templateFiles.main, buildPaths);
    const fileEntities = await this.generateFromTemplates(mainFiles, context);

    // Handle extra files (e.g., lit index.html)
    if (templateFiles.extra && templateFiles.extra.length > 0) {
      const extraFiles = this.buildFileDefinitions(
        templateFiles.extra,
        buildPaths
      );
      const extraFileEntities = await this.generateFromTemplates(
        extraFiles,
        {}
      );
      fileEntities.push(...extraFileEntities);
    }
    return fileEntities;
  }

  /**
   * Get template files configuration for a specific framework
   */
  private getTemplateFilesForFramework(
    framework: keyof UIFrameworks, 
    uiLibrary: UiLibrary = 'none'
  ): {
    main: ShowcaseTemplateFile[];
    extra?: ShowcaseTemplateFile[];
  } {
    const frameworkConfigs: Record<
      SupportedFramework,
      {
        main: ShowcaseTemplateFile[];
        extra?: ShowcaseTemplateFile[];
      }
    > = {
      react: {
        main: uiLibrary === 'shadcn' 
          ? [
              new ShowcaseTemplateFile("react/shadcn/App-shadcn.tsx.hbs", "App.tsx"),
              new ShowcaseTemplateFile("shared/App.css.hbs", "App.css"),
            ]
          : [
              new ShowcaseTemplateFile("react/App.tsx.hbs", "App.tsx"),
              new ShowcaseTemplateFile("shared/App.css.hbs", "App.css"),
            ],
        extra: uiLibrary === 'shadcn' 
          ? [new ShowcaseTemplateFile("react/shadcn/shadcn.utils.ts.hbs", "utils.ts"),
              new ShowcaseTemplateFile("react/shadcn/shadcn.components.ts.hbs", "components.ts")
          ]
          : undefined,
      },
      angular: {
        main: [
          new ShowcaseTemplateFile(
            "angular/app.component.ts.hbs",
            "app.component.ts"
          ),
          new ShowcaseTemplateFile(
            "angular/app.component.html.hbs",
            "app.component.html"
          ),
          new ShowcaseTemplateFile("shared/App.css.hbs", "app.component.scss"),
        ],
      },
      vue: {
        main: [
          new ShowcaseTemplateFile("vue/App.vue.hbs", "App.vue"),
          new ShowcaseTemplateFile("shared/App.css.hbs", "App.css"),
        ],
      },
      lit: {
        main: [
          new ShowcaseTemplateFile("lit/App.ts.hbs", "App.ts"),
          new ShowcaseTemplateFile("shared/App.css.hbs", "App.css"),
        ],
        extra: [new ShowcaseTemplateFile("lit/index.html.hbs", "index.html")],
      },
    };

    return frameworkConfigs[framework as SupportedFramework] || { main: [] };
  }

  /**
   * Build file definitions with computed paths
   */
  private buildFileDefinitions(
    files: ShowcaseTemplateFile[],
    buildPaths: PathBuilder
  ): TemplateFileDefinition[] {
    return files.map((file) => {
      const paths = buildPaths(file.template, file.output);
      return {
        templatePath: paths.templatePath,
        outputPath: paths.outputPath,
      };
    });
  }

  private async generateFromTemplates(
    files: TemplateFileDefinition[],
    context: TemplateContext
  ): Promise<FileEntity[]> {
    const fileEntities: FileEntity[] = [];

    for (const { templatePath, outputPath } of files) {
      const templateFileEntity =
        await this.fileService.readTemplate(templatePath);

      const compiled = Handlebars.compile(templateFileEntity.content);
      const rendered = compiled(context);

      const file = new FileEntity(outputPath, rendered.trim());
      fileEntities.push(file);
    }
    return fileEntities;
  }
}
