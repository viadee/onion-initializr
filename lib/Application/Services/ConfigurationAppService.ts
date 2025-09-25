import { FileEntity } from '../../Domain/Entities/FileEntity';
import { FileService } from '../../Domain/Services/FileService';
import { PathAppService } from './PathAppService';

export class ConfigurationAppService {
  constructor(
    private readonly fileService: FileService,
    private readonly pathService: PathAppService
  ) {}
  async updateVerbatimModuleSyntax(
    folderPath: string,
    value: boolean
  ): Promise<FileEntity> {
    const configPath = await this.findTsConfigFile(folderPath);
    
    if (!configPath) {
      throw new Error("No valid tsconfig file found");
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

  private async findTsConfigFile(folderPath: string): Promise<string> {
    // Try tsconfig.app.json first (CLI), then fallback to tsconfig.json (WEB)
    const appConfigPath = this.pathService.join(folderPath, 'tsconfig.app.json');
    const mainConfigPath = this.pathService.join(folderPath, 'tsconfig.json');
    
    if (await this.fileService.fileExists(appConfigPath)) {
      return appConfigPath;
    } else
      return mainConfigPath;
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
