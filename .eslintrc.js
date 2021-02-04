module.exports = {
  env: {
    jest: true,
    es2021: true
  },
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts']
      }
    }
  },
  rules: {
    'prettier/prettier': 'error',
    'import/prefer-default-export': 0,
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    'max-len': ['error', { code: 150 }],
    'object-shorthand': ['warn', 'properties'],
    'object-curly-newline': [
      'error',
      {
        ObjectPattern: { multiline: true },
        ImportDeclaration: { multiline: true },
        ExportDeclaration: { multiline: true }
      }
    ],
    'require-jsdoc': 'off',
    'no-use-before-define': 'off',
    'no-console': 'off',
    'arrow-body-style': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never'
      }
    ]
  }
};
