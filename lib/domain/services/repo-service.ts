import { DiFramework } from '../entities/di-framework';
import { FileEntity } from '../entities/file-entity';
import { TemplateService } from './template-service';

export class RepoService {
  generateRepositoriesFiles(
    entitiesRepository: string[],
    diFramework: DiFramework,
    templateContent: string,
    infraRepoDir: string
  ): FileEntity[] {
    const template = new TemplateService<{
      entityName: string;
      useAngularDI: boolean;
    }>(templateContent);

    const fileEntities: FileEntity[] = [];
    const useAngularDI = diFramework === 'angular';

    entitiesRepository.forEach((entityRepository: string) => {
      const filePath = `${infraRepoDir}/${entityRepository}Repository.ts`;

      const code = template.render({
        entityName: entityRepository,
        useAngularDI,
      });
      const file = new FileEntity(filePath, code);
      fileEntities.push(file);
    });

    return fileEntities;
  }
}
