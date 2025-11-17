const nx = require('@nx/eslint-plugin');

module.exports = [
  {
    ignores: [
      '**/dist',
      '**/node_modules',
      '**/tmp',
      '**/.nx',
      '**/coverage',
      '**/playwright-report',
      '**/test-results',
    ],
  },

  // Base configs for all files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@nx': nx,
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:domain'],
            },
            {
              sourceTag: 'type:application',
              onlyDependOnLibsWithTags: ['type:domain', 'type:application'],
            },
            {
              sourceTag: 'type:infrastructure',
              onlyDependOnLibsWithTags: [
                'type:domain',
                'type:application',
                'type:infrastructure',
              ],
            },
            {
              sourceTag: 'type:presentation',
              onlyDependOnLibsWithTags: [
                'type:domain',
                'type:application',
                'type:infrastructure',
                'type:presentation',
              ],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },

  // TypeScript specific rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'prefer-const': 'error',
    },
  },

  // Domain layer restrictions
  {
    files: ['**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/infrastructure/**',
                '../infrastructure/**',
                '*/infrastructure/*',
              ],
              message:
                'Domain layer cannot import from infrastructure layer. Domain should only depend on other domain code.',
            },
            {
              group: [
                '**/application/**',
                '../application/**',
                '*/application/*',
              ],
              message:
                'Domain layer cannot import from application layer. Domain should be independent of application concerns.',
            },
          ],
        },
      ],
    },
  },

  // Application layer restrictions
  {
    files: ['**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/infrastructure/**',
                '../infrastructure/**',
                '*/infrastructure/*',
              ],
              message:
                'Application layer cannot import from infrastructure layer. Application should only depend on domain.',
            },
          ],
        },
      ],
    },
  },

  // Test files
  {
    files: [
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
      '**/*.test.ts',
      '**/*.test.js',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
