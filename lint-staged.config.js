module.exports = {
  '*.{js,jsx,ts,tsx}': (filenames) => [
    // run eslint --fix on changed files
    `eslint --max-warnings=0 --fix ${filenames.join(' ')}`,
    // then format with prettier
    `prettier --write ${filenames.join(' ')}`
  ],
  '*.{json,md,css,scss,html}': [`prettier --write ${filenames.join(' ')}`]
};
