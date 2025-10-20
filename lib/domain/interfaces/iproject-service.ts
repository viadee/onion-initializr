import { UIFrameworks } from '../entities/ui-framework';
import { DiFramework } from '../entities/di-framework';
import { UiLibrary } from '../entities/ui-library';

export interface IProjectService {
  isInitialized(folderPath: string): Promise<boolean>;
  initialize(
    folderPath: string,
    uiFramework?: keyof UIFrameworks,
    diFramework?: DiFramework,
    uiLibrary?: UiLibrary,
  ): Promise<
    { uiFramework: keyof UIFrameworks; diFramework: DiFramework; uiLibrary: UiLibrary } | undefined
  >;
}
