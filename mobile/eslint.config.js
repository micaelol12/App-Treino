const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  globalIgnores(['.expo/**', 'coverage/**', 'android/**', 'ios/**']),
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    rules: {
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/features/*/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'expo*', 'firebase*', '@/shared/**'],
              message: 'A camada de domínio deve permanecer independente de frameworks.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/*/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-native', 'expo*', 'firebase*'],
              message:
                'Casos de uso não devem depender de UI ou infraestrutura concreta.',
            },
          ],
        },
      ],
    },
  },
]);
