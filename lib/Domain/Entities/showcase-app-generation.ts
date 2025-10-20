import { UIFrameworks } from './ui-framework';
import { UiLibrary } from './ui-library';

export class ShowcaseAppGeneration {
  constructor(
    public readonly basePath: string,
    public readonly framework: keyof UIFrameworks,
    public readonly useAngularDI: boolean,
    public readonly uiLibrary: UiLibrary = 'none',
    public readonly firstAppService?: string
  ) {}
}
