import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
  {
    // Lint only the new `src/` tree. The old Nuxt directories are kept as
    // reference for later migration phases and must not be linted.
    ignores: [
      'dist/',
      'node_modules/',
      'public/',
      'pages/',
      'components/',
      'layouts/',
      'store/',
      'plugins/',
      'middleware/',
      'utilities/',
      'assets/',
      'serve.js'
    ]
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // The ported lib code (Api.js, VCFParser.js) intentionally keeps the
      // legacy `new Promise(async ...)` pattern unchanged — logic is preserved
      // verbatim from the Vue 2 app, only imports/paths were updated.
      'no-async-promise-executor': 'off',
      // View components are named after their routes (Index, About, Wizard,
      // Graph) — single-word names are intentional here.
      'vue/multi-word-component-names': 'off'
    }
  }
]
