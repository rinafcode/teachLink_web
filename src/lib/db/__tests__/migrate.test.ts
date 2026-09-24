import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logging', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

vi.mock('node:fs', () => ({
  default: {
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

const { mockClient, mockQuery } = vi.hoisted(() => {
  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    release: vi.fn(),
  };
  const mockQuery = vi.fn();
  return { mockClient, mockQuery };
});

vi.mock('../pool', () => ({
  getClient: vi.fn(() => Promise.resolve(mockClient)),
  query: mockQuery,
}));

import fs from 'node:fs';
import { runMigrations } from '../migrate';
import { getClient, query } from '../pool';

describe('runMigrations – transaction wrapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('wraps each migration in BEGIN / COMMIT and records it', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue(['001_test.sql'] as unknown as fs.Dirent[]);
    vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE foo (id INT);');
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })          // ensureMigrationsTable
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });          // getAppliedMigrations (empty)

    await runMigrations();

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('CREATE TABLE foo (id INT);');
    expect(mockClient.query).toHaveBeenCalledWith('INSERT INTO _migrations (name) VALUES ($1)', ['001_test.sql']);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('skips already-applied migrations', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue(['001_test.sql'] as unknown as fs.Dirent[]);
    vi.mocked(fs.readFileSync).mockReturnValue('CREATE TABLE foo (id INT);');
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })          // ensureMigrationsTable
      .mockResolvedValueOnce({ rows: [{ name: '001_test.sql' }], rowCount: 1 }); // already applied

    await runMigrations();

    expect(getClient).not.toHaveBeenCalled();
  });

  it('ROLLBACKs on error and rethrows, releasing the client', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue(['002_bad.sql'] as unknown as fs.Dirent[]);
    vi.mocked(fs.readFileSync).mockReturnValue('INVALID SQL;');
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })          // ensureMigrationsTable
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });          // getAppliedMigrations (empty)

    const dbError = new Error('syntax error');
    mockClient.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
      .mockRejectedValueOnce(dbError)                     // migration SQL fails
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

    await expect(runMigrations()).rejects.toThrow('syntax error');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('applies multiple migrations sequentially in separate transactions', async () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      '001_a.sql',
      '002_b.sql',
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.readFileSync)
      .mockReturnValueOnce('CREATE TABLE a (id INT);')
      .mockReturnValueOnce('CREATE TABLE b (id INT);');

    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // ensureMigrationsTable
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // getAppliedMigrations (empty)

    await runMigrations();

    expect(getClient).toHaveBeenCalledTimes(2);

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });
});
