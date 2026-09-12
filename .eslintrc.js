/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['./packages/config/eslint-base.js'],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '**/*.js',
    '**/*.mjs',
  ],
};
