import { UIFrameworks } from './UiFramework';

export class ShowcaseAppGeneration {
  constructor(
    public readonly basePath: string,
    public readonly framework: keyof UIFrameworks,
    public readonly useAngularDI: boolean,
    public readonly firstAppService?: string
  ) {}
}
