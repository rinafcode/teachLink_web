/**
 * Markdown Renderer Schema Versioning (#413).
 *
 * Provides a single source of truth for the rendered-document schema
 * version and a forward-compatible migration path so older stored
 * render trees can still load.
 */

export const CURRENT_SCHEMA_VERSION = '1.1.0' as const;
export type SchemaVersion = typeof CURRENT_SCHEMA_VERSION | '1.0.0';

export interface MarkdownDoc {
  schemaVersion: SchemaVersion;
  source: string;
  rendered: RenderNode[];
}

export type RenderNode =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; lang?: string; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'blockquote'; text: string };

type Doc000 = Omit<MarkdownDoc, 'schemaVersion' | 'rendered'> & {
  schemaVersion?: undefined;
  blocks: RenderNode[]; // legacy key
};

type Migration = (doc: unknown) => unknown;

const MIGRATIONS: Record<string, Migration> = {
  // Pre-versioned docs only had a top-level `blocks` key, not `rendered`.
  '1.0.0': (raw) => {
    const legacy = raw as Doc000;
    return {
      schemaVersion: '1.0.0' as SchemaVersion,
      source: legacy.source,
      rendered: legacy.blocks ?? [],
    };
  },
};

function isSchemaVersion(v: string): v is SchemaVersion {
  return v === '1.0.0' || v === '1.1.0';
}

export function migrate(raw: unknown): MarkdownDoc {
  if (!raw || typeof raw !== 'object') {
    throw new Error('SchemaVersion: invalid document');
  }
  const r = raw as Partial<MarkdownDoc>;
  const declared = (r.schemaVersion as string | undefined) ?? '1.0.0';
  let working: unknown = raw;
  let version: string = declared;
  // Apply any migrations between the declared version and CURRENT.
  while (version !== CURRENT_SCHEMA_VERSION) {
    const m = MIGRATIONS[version];
    if (!m) break;
    working = m(working);
    const w = working as Partial<MarkdownDoc>;
    version = w.schemaVersion ?? version;
  }
  const final = working as MarkdownDoc;
  if (!isSchemaVersion(final.schemaVersion)) {
    throw new Error(`SchemaVersion: unsupported ${final.schemaVersion}`);
  }
  return final;
}

export function isVersionCompatible(version: string): boolean {
  return isSchemaVersion(version);
}
