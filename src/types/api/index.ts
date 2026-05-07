/**
 * types/api — Request/Response DTOs and Zod validation schemas for all API routes.
 *
 * Each module follows the pattern:
 *   - <Entity>Schema      — Zod schema used for runtime validation
 *   - <Entity>DTO         — TypeScript type inferred from the schema (or re-exported from shared types)
 *
 * Usage in route handlers:
 *   import { LoginRequestSchema, type LoginRequestDTO } from '@/types/api/auth.dto';
 */

export * from './auth.dto';
export * from './notes.dto';
export * from './courses.dto';
export * from './bookmarks.dto';
