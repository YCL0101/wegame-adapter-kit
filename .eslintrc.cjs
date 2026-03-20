module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', 'coverage'],
  overrides: [
    {
      files: ['**/*.ts'],
      parserOptions: {
        project: false,
        sourceType: 'module'
      },
      rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface']
      }
    }
  ]
}
