import { UIFrameworks } from '../Entities/ui-framework';
import { DiFramework } from '../Entities/di-framework';
import { UiLibrary } from '../Entities/ui-library';

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
