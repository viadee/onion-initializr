import { UIFrameworks } from '../Entities/UiFramework';
import { DiFramework } from '../Entities/DiFramework';
import { UiLibrary } from '../Entities/UiLibrary';

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
