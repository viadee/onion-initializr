export type DiFramework = 'awilix' | 'angular';

export const VALID_DI_FRAMEWORKS: DiFramework[] = ['awilix', 'angular'];

export function isValidDiFramework(value: string): value is DiFramework {
  return VALID_DI_FRAMEWORKS.includes(value as DiFramework);
}
