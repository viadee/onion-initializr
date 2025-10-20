/**
 * Domain Entity: UiFramework
 */
export interface UIFrameworks {
  react: string;
  angular: string;
  vue: string;
  lit: string;
  vanilla: string;
}

export const VALID_UI_FRAMEWORKS: (keyof UIFrameworks)[] = [
  'react',
  'angular',
  'vue',
  'lit',
  'vanilla',
];

export function isValidUiFramework(value: string): value is keyof UIFrameworks {
  return VALID_UI_FRAMEWORKS.includes(value as keyof UIFrameworks);
}
