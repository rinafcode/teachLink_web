const config = {
  '*.{js,jsx,ts,tsx}': (filenames) => {
    const quoted = filenames.map((f) => `"${f.replace(/"/g, '\\"')}"`).join(' ');
    return [
      // run eslint --fix on changed files (quoting paths for Windows)
      `eslint --max-warnings=0 --fix ${quoted}`,
      // then format with prettier
      `prettier --write ${quoted}`,
    ];
  },
  '*.{json,md,css,scss,html}': (filenames) => {
    const quoted = filenames.map((f) => `"${f.replace(/"/g, '\\"')}"`).join(' ');
    return [`prettier --write ${quoted}`];
  },
  '*.{js,jsx,ts,tsx}': (filenames) => [
    // run eslint --fix on changed files
    `eslint --max-warnings=0 --no-warn-ignored --fix ${filenames.join(' ')}`,
    // then format with prettier
    `prettier --write ${filenames.join(' ')}`,
  ],
  '*.{json,md,css,scss,html}': (filenames) => [`prettier --write ${filenames.join(' ')}`],
};

export default config;
