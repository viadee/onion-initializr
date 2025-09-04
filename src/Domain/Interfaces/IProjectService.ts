import { UIFrameworks } from '../Entities/UiFramework';
import { DiFramework } from '../Entities/DiFramework';

export interface IProjectService {
  isInitialized(folderPath: string): Promise<boolean>;
  initialize(
    folderPath: string,
    uiFramework?: keyof UIFrameworks,
    diFramework?: DiFramework
  ): Promise<
    { uiFramework: keyof UIFrameworks; diFramework: DiFramework } | undefined
  >;
}
