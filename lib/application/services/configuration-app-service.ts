import { FileEntity } from '../../Domain/Entities/file-entity';
import { FileService } from '../../Domain/Services/file-service';
import { PathAppService } from './path-app-service';

export class ConfigurationAppService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}
  async updateVerbatimModuleSyntax(
    folderPath: string,
    value: boolean
  ): Promise<FileEntity | null> {
    const configPath = await this.findTsConfigFile(folderPath);
    
    if (!configPath) {
      return null;
    }

    const configFile = await this.fileService.readFile(configPath);
    const cleanContent = this.removeJsonComments(configFile.content);

      const configContent = JSON.parse(cleanContent);

      configContent.compilerOptions = {
        ...configContent.compilerOptions,
        verbatimModuleSyntax: value,
      };

      return {
        filePath: configPath,
        content: JSON.stringify(configContent, null, 2),
      };
  }

  private async findTsConfigFile(folderPath: string): Promise<string | null> {
    // Try tsconfig.app.json first (CLI), then fallback to tsconfig.json (WEB)
    const appConfigPath = this.pathService.join(folderPath, 'tsconfig.app.json');
    const mainConfigPath = this.pathService.join(folderPath, 'tsconfig.json');
    
    if (await this.fileService.fileExists(appConfigPath)) {
      return appConfigPath;
    } else if (await this.fileService.fileExists(mainConfigPath)) {
      return mainConfigPath;
    } else {
      return null;
    }
  }

  private removeJsonComments(content: string): string {
    return content
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return (
          !trimmed.startsWith('/*') &&
          !trimmed.startsWith('//') &&
          !trimmed.startsWith('*/')
        );
      })
      .join('\n');
  }
}
