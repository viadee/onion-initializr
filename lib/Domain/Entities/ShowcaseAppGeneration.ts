import { UIFrameworks } from './UiFramework';
import { UiLibrary } from './UiLibrary';

export class ShowcaseAppGeneration {
  constructor(
    public readonly basePath: string,
    public readonly framework: keyof UIFrameworks,
    public readonly useAngularDI: boolean,
    public readonly uiLibrary: UiLibrary = 'none',
    public readonly firstAppService?: string
  ) {}
}
