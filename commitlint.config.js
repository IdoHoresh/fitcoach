module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'test', // Adding or updating tests
        'docs', // Documentation only
        'chore', // Tooling, config, dependencies
        'style', // Formatting, missing semicolons, etc.
        'perf', // Performance improvement
        'ci', // CI/CD changes
        'revert', // Revert a previous commit
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-max-length': [2, 'always', 72],
  },
}
