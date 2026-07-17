// @ts-check

/** @type {import('lint-staged').Config} */
const config = {
  // TypeScript and JavaScript files: run ESLint (auto-fix) + Prettier (format)
  '**/*.{ts,tsx,js,mjs}': ['eslint --fix', 'prettier --write'],
  // JSON, Markdown, CSS: format only with Prettier
  '**/*.{json,md,css}': ['prettier --write'],
}

export default config
