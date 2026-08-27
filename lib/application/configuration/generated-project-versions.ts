//Pin versions to ensure that project generation procedures don't break down
export const GENERATED_PROJECT_VERSIONS = {
  // React
  react: '^18.3.1',
  reactDom: '^18.3.1',
  reactTypes: '^18.3.1',
  reactDomTypes: '^18.3.1',

  // Build tools
  vite: '^7.1.2',
  angularCli: '^20.3.8',

  //ui libraries
  shadcn: '2.7.0',

  // Tailwind
  tailwindcss: '^4.3.3',
  tailwindcssCli: '^0.1.2',
  postcss: '^8.5.26',
  autoprefixer: '^10.5.4',
  tailwindTypography: '^0.5.20',
  tailwindVite: '^4.3.3',
  tailwindPostcss: '^4.3.3',

  // Radix
  radixReactSlot: '^1.3.3',
  radixReactDialog: '^1.1.23',
  radixReactDropdownMenu: '^2.1.24',

  // Typescript utilities
  classVarianceAuthority: '^0.7.1',
} as const;
