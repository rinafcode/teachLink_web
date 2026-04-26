const config = {
  '*.{js,jsx,ts,tsx}': (filenames) => [
    // run eslint --fix on changed files
    `eslint --max-warnings=0 --no-warn-ignored --fix ${filenames.map((f) => `"${f}"`).join(' ')}`,
    // then format with prettier
    `prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`,
  ],
  '*.{json,md,css,scss,html}': (filenames) => [`prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`],
};

export default config;
