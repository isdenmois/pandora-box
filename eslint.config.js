import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import { globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import pluginPlaywright from 'eslint-plugin-playwright'
import pluginVue from 'eslint-plugin-vue'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/build/**']),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  skipFormatting,
  importPlugin.flatConfigs.recommended,
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'import/no-unresolved': 'off',
      'import/no-named-as-default': 'off',
      'import/namespace': 'off',
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js builtins, including node: prefix
            'external', // External libraries from node_modules
            'internal', // Internal aliases, e.g. '@/'
            'parent', // Relative imports like '../'
            'sibling', // Relative imports like './'
            'index',
          ],
          pathGroups: [
            {
              pattern: 'node:*',
              group: 'builtin',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@/app/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/features/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@/entities/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@/shared/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin', 'external'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
)
