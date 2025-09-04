import Handlebars from 'handlebars';

import { FileEntity } from '../Entities/FileEntity';
import { DiFramework } from '../Entities/DiFramework';

export class RepoService {
  generateRepositoriesFiles(
    entitiesRepository: string[],
    diFramework: DiFramework,
    templateContent: string,
    infraRepoDir: string
  ): FileEntity[] {
    const template = Handlebars.compile(templateContent);

    const fileEntities: FileEntity[] = [];
    const useAngularDI = diFramework === 'angular';

    entitiesRepository.forEach((entityRepository: string) => {
      const filePath = `${infraRepoDir}/${entityRepository}Repository.ts`;

      const code = template({ entityName: entityRepository, useAngularDI });
      const file = new FileEntity(filePath, code);
      fileEntities.push(file);
    });

    return fileEntities;
  }
}
