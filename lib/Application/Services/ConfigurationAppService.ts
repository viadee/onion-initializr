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
  ): Promise<FileEntity | null> {
    const configPath = this.pathService.join(folderPath, 'tsconfig.json');

    if (!(await this.fileService.fileExists(configPath))) {
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
