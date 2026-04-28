import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createEslintConfig } from '@teachlink/tooling/eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default createEslintConfig(__dirname);
