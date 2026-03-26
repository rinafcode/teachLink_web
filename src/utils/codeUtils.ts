/**
 * Code Editor Utilities
 * Provides language configs, auto-completion suggestions, code formatting,
 * validation, and simulated code execution for the Advanced Code Editor.
 */

// ---------------------------------------------------------------------------
// Language registry
// ---------------------------------------------------------------------------

export interface LanguageConfig {
  id: string;
  label: string;
  extension: string;
  monacoLanguage: string;
  color: string;
  defaultCode: string;
}

const LANGUAGE_REGISTRY: LanguageConfig[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    extension: 'js',
    monacoLanguage: 'javascript',
    color: '#f7df1e',
    defaultCode:
      '// JavaScript\nconsole.log("Hello, World!");\n',
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    extension: 'ts',
    monacoLanguage: 'typescript',
    color: '#3178c6',
    defaultCode:
      '// TypeScript\nconst greeting: string = "Hello, World!";\nconsole.log(greeting);\n',
  },
  {
    id: 'python',
    label: 'Python',
    extension: 'py',
    monacoLanguage: 'python',
    color: '#3572A5',
    defaultCode: '# Python\nprint("Hello, World!")\n',
  },
  {
    id: 'java',
    label: 'Java',
    extension: 'java',
    monacoLanguage: 'java',
    color: '#b07219',
    defaultCode:
      '// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
  },
  {
    id: 'cpp',
    label: 'C++',
    extension: 'cpp',
    monacoLanguage: 'cpp',
    color: '#f34b7d',
    defaultCode:
      '// C++\n#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
  },
  {
    id: 'rust',
    label: 'Rust',
    extension: 'rs',
    monacoLanguage: 'rust',
    color: '#dea584',
    defaultCode:
      '// Rust\nfn main() {\n    println!("Hello, World!");\n}\n',
  },
  {
    id: 'go',
    label: 'Go',
    extension: 'go',
    monacoLanguage: 'go',
    color: '#00ADD8',
    defaultCode:
      '// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
  },
  {
    id: 'html',
    label: 'HTML',
    extension: 'html',
    monacoLanguage: 'html',
    color: '#e34c26',
    defaultCode:
      '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Hello</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>\n',
  },
  {
    id: 'css',
    label: 'CSS',
    extension: 'css',
    monacoLanguage: 'css',
    color: '#563d7c',
    defaultCode:
      '/* CSS */\nbody {\n  font-family: sans-serif;\n  color: #333;\n}\n',
  },
  {
    id: 'sql',
    label: 'SQL',
    extension: 'sql',
    monacoLanguage: 'sql',
    color: '#e38c00',
    defaultCode:
      '-- SQL\nSELECT * FROM users WHERE active = 1;\n',
  },
];

export const getAllLanguages = (): LanguageConfig[] => LANGUAGE_REGISTRY;

export const getLanguageConfig = (languageId: string): LanguageConfig => {
  return (
    LANGUAGE_REGISTRY.find((l) => l.id === languageId) ?? LANGUAGE_REGISTRY[0]
  );
};

// ---------------------------------------------------------------------------
// Auto-completion suggestions
// ---------------------------------------------------------------------------

export interface CompletionSuggestion {
  label: string;
  kind: 'keyword' | 'snippet' | 'function' | 'variable';
  detail: string;
  insertText: string;
}

const SUGGESTIONS_MAP: Record<string, CompletionSuggestion[]> = {
  javascript: [
    { label: 'console.log', kind: 'function', detail: 'Log to console', insertText: 'console.log($1)' },
    { label: 'const', kind: 'keyword', detail: 'Declare constant', insertText: 'const $1 = $2;' },
    { label: 'let', kind: 'keyword', detail: 'Declare variable', insertText: 'let $1 = $2;' },
    { label: 'function', kind: 'snippet', detail: 'Function declaration', insertText: 'function $1($2) {\n  $3\n}' },
    { label: 'arrow function', kind: 'snippet', detail: 'Arrow function', insertText: 'const $1 = ($2) => {\n  $3\n};' },
    { label: 'if', kind: 'keyword', detail: 'If statement', insertText: 'if ($1) {\n  $2\n}' },
    { label: 'for', kind: 'keyword', detail: 'For loop', insertText: 'for (let $1 = 0; $1 < $2; $1++) {\n  $3\n}' },
    { label: 'forEach', kind: 'function', detail: 'Array forEach', insertText: '$1.forEach(($2) => {\n  $3\n});' },
    { label: 'Promise', kind: 'snippet', detail: 'Promise constructor', insertText: 'new Promise((resolve, reject) => {\n  $1\n})' },
    { label: 'async/await', kind: 'snippet', detail: 'Async function', insertText: 'async function $1($2) {\n  const $3 = await $4;\n}' },
  ],
  typescript: [
    { label: 'interface', kind: 'keyword', detail: 'Interface declaration', insertText: 'interface $1 {\n  $2\n}' },
    { label: 'type', kind: 'keyword', detail: 'Type alias', insertText: 'type $1 = $2;' },
    { label: 'enum', kind: 'keyword', detail: 'Enum declaration', insertText: 'enum $1 {\n  $2\n}' },
    { label: 'console.log', kind: 'function', detail: 'Log to console', insertText: 'console.log($1)' },
    { label: 'const', kind: 'keyword', detail: 'Declare constant', insertText: 'const $1: $2 = $3;' },
    { label: 'function', kind: 'snippet', detail: 'Function', insertText: 'function $1($2: $3): $4 {\n  $5\n}' },
    { label: 'React.FC', kind: 'snippet', detail: 'React function component', insertText: 'const $1: React.FC<$2> = ($3) => {\n  return (\n    $4\n  );\n};' },
    { label: 'useState', kind: 'function', detail: 'React useState hook', insertText: 'const [$1, set$1] = useState<$2>($3);' },
  ],
  python: [
    { label: 'print', kind: 'function', detail: 'Print to stdout', insertText: 'print($1)' },
    { label: 'def', kind: 'keyword', detail: 'Function definition', insertText: 'def $1($2):\n    $3' },
    { label: 'class', kind: 'keyword', detail: 'Class definition', insertText: 'class $1:\n    def __init__(self):\n        $2' },
    { label: 'if', kind: 'keyword', detail: 'If statement', insertText: 'if $1:\n    $2' },
    { label: 'for', kind: 'keyword', detail: 'For loop', insertText: 'for $1 in $2:\n    $3' },
    { label: 'import', kind: 'keyword', detail: 'Import module', insertText: 'import $1' },
    { label: 'list comprehension', kind: 'snippet', detail: 'List comprehension', insertText: '[$1 for $2 in $3]' },
    { label: 'lambda', kind: 'keyword', detail: 'Lambda function', insertText: 'lambda $1: $2' },
  ],
  java: [
    { label: 'System.out.println', kind: 'function', detail: 'Print line', insertText: 'System.out.println($1);' },
    { label: 'public class', kind: 'snippet', detail: 'Class declaration', insertText: 'public class $1 {\n    $2\n}' },
    { label: 'public static void main', kind: 'snippet', detail: 'Main method', insertText: 'public static void main(String[] args) {\n    $1\n}' },
    { label: 'for', kind: 'keyword', detail: 'For loop', insertText: 'for (int $1 = 0; $1 < $2; $1++) {\n    $3\n}' },
    { label: 'ArrayList', kind: 'snippet', detail: 'ArrayList declaration', insertText: 'ArrayList<$1> $2 = new ArrayList<>();' },
  ],
  rust: [
    { label: 'println!', kind: 'function', detail: 'Print macro', insertText: 'println!("{}", $1);' },
    { label: 'fn', kind: 'keyword', detail: 'Function', insertText: 'fn $1($2) -> $3 {\n    $4\n}' },
    { label: 'let', kind: 'keyword', detail: 'Variable binding', insertText: 'let $1 = $2;' },
    { label: 'let mut', kind: 'keyword', detail: 'Mutable binding', insertText: 'let mut $1 = $2;' },
    { label: 'match', kind: 'keyword', detail: 'Match expression', insertText: 'match $1 {\n    $2 => $3,\n    _ => $4,\n}' },
    { label: 'struct', kind: 'keyword', detail: 'Struct definition', insertText: 'struct $1 {\n    $2: $3,\n}' },
  ],
  go: [
    { label: 'fmt.Println', kind: 'function', detail: 'Print line', insertText: 'fmt.Println($1)' },
    { label: 'func', kind: 'keyword', detail: 'Function', insertText: 'func $1($2) $3 {\n    $4\n}' },
    { label: 'var', kind: 'keyword', detail: 'Variable declaration', insertText: 'var $1 $2 = $3' },
    { label: 'for', kind: 'keyword', detail: 'For loop', insertText: 'for $1 := 0; $1 < $2; $1++ {\n    $3\n}' },
    { label: 'goroutine', kind: 'snippet', detail: 'Goroutine', insertText: 'go func() {\n    $1\n}()' },
  ],
};

export const getAutoCompletionSuggestions = (
  languageId: string,
  word: string = '',
): CompletionSuggestion[] => {
  const all = SUGGESTIONS_MAP[languageId] ?? SUGGESTIONS_MAP['javascript'];
  if (!word) return all;
  const lower = word.toLowerCase();
  return all.filter((s) => s.label.toLowerCase().startsWith(lower));
};

// ---------------------------------------------------------------------------
// Code formatting
// ---------------------------------------------------------------------------

export const formatCode = (languageId: string, code: string): string => {
  if (!code) return code;

  // Universal: trim trailing whitespace per line
  const lines = code.split('\n').map((line) => line.trimEnd());

  // Remove consecutive blank lines (max 1)
  const normalized: string[] = [];
  let prevBlank = false;
  for (const line of lines) {
    const isBlank = line.trim() === '';
    if (isBlank && prevBlank) continue;
    normalized.push(line);
    prevBlank = isBlank;
  }

  // Ensure single trailing newline
  const result = normalized.join('\n').trimEnd() + '\n';

  // Python: enforce 4-space indentation (convert tabs → spaces)
  if (languageId === 'python') {
    return result
      .split('\n')
      .map((l) => l.replace(/^\t+/, (t) => '    '.repeat(t.length)))
      .join('\n');
  }

  return result;
};

// ---------------------------------------------------------------------------
// Code validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ line: number; message: string }>;
}

export const validateCode = (languageId: string, code: string): ValidationResult => {
  const errors: Array<{ line: number; message: string }> = [];

  if (!code.trim()) {
    return { isValid: false, errors: [{ line: 1, message: 'Code is empty' }] };
  }

  const lines = code.split('\n');

  if (languageId === 'javascript' || languageId === 'typescript') {
    lines.forEach((line, i) => {
      // Very lightweight checks
      if (/\bconsole\.log\s*\(/.test(line) && !line.trimEnd().endsWith(';') && !line.trimEnd().endsWith(',')) {
        // not enforced as error — just a style note, skip
      }
      if (/^\s*eval\s*\(/.test(line)) {
        errors.push({ line: i + 1, message: 'Avoid using eval() — security risk' });
      }
    });
  }

  if (languageId === 'python') {
    lines.forEach((line, i) => {
      if (/^\t/.test(line)) {
        errors.push({ line: i + 1, message: 'Use spaces instead of tabs for indentation' });
      }
    });
  }

  if (languageId === 'sql') {
    if (!/SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER/i.test(code)) {
      errors.push({ line: 1, message: 'No recognizable SQL statement found' });
    }
  }

  return { isValid: errors.length === 0, errors };
};

// ---------------------------------------------------------------------------
// Simulated code execution
// ---------------------------------------------------------------------------

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

const EXECUTION_TEMPLATES: Record<string, (code: string) => ExecutionResult> = {
  javascript: (code) => {
    const match = code.match(/console\.log\s*\((['"`])(.*?)\1\)/);
    return {
      stdout: match ? match[2] : 'Script executed successfully.',
      stderr: '',
      exitCode: 0,
      executionTimeMs: Math.floor(Math.random() * 50) + 10,
    };
  },
  python: (code) => {
    const match = code.match(/print\s*\((['"])(.*?)\1\)/);
    return {
      stdout: match ? match[2] : 'Script executed successfully.',
      stderr: '',
      exitCode: 0,
      executionTimeMs: Math.floor(Math.random() * 80) + 20,
    };
  },
};

export const simulateCodeExecution = (
  languageId: string,
  code: string,
): ExecutionResult => {
  const validation = validateCode(languageId, code);

  if (!validation.isValid && validation.errors[0]?.message === 'Code is empty') {
    return {
      stdout: '',
      stderr: 'Error: No code to execute.',
      exitCode: 1,
      executionTimeMs: 0,
    };
  }

  const template = EXECUTION_TEMPLATES[languageId];
  if (template) return template(code);

  // Generic fallback for compiled languages (simulated)
  return {
    stdout: `[Simulated] ${getLanguageConfig(languageId).label} program ran successfully.\nHello, World!`,
    stderr: '',
    exitCode: 0,
    executionTimeMs: Math.floor(Math.random() * 200) + 50,
  };
};
