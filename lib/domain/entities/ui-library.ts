/**
 * Domain Entity: UiLibrary
 * Represents UI component libraries that can be used with different frameworks
 */
export type UiLibrary = 'none' | 'shadcn';

export const VALID_UI_LIBRARIES: UiLibrary[] = ['none', 'shadcn'];

export function isValidUiLibrary(value: string): value is UiLibrary {
  return VALID_UI_LIBRARIES.includes(value as UiLibrary);
}

// Framework-specific UI libraries mapping
export const FRAMEWORK_UI_LIBRARIES: Record<string, UiLibrary[]> = {
  react: ['none', 'shadcn'],
  vue: ['none'],
  angular: ['none'],
  lit: ['none'],
  vanilla: ['none'],
};

export function getAvailableUiLibrariesForFramework(
  framework: string
): UiLibrary[] {
  return FRAMEWORK_UI_LIBRARIES[framework] || ['none'];
}
