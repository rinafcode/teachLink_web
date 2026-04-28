import { analyzeQueryComplexity } from './complexity';
import { buildPersistedQueryPayload } from './persistedQueries';
import { buildQuery } from './queryBuilder';
import type {
  GraphQLMonitoringReport,
  GraphQLQueryConfig,
  GraphQLRequestOptions,
  GraphQLVariables,
} from './types';

const DEFAULT_MAX_COMPLEXITY = 250;

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

export class GraphQLClient {
  constructor(private readonly endpoint: string) {}

  async execute<TData>(
    queryConfig: GraphQLQueryConfig,
    options: GraphQLRequestOptions = {},
  ): Promise<TData> {
    const query = buildQuery(queryConfig);
    const report = analyzeQueryComplexity(query);
    const maxComplexity = options.maxComplexity ?? DEFAULT_MAX_COMPLEXITY;

    if (report.complexity > maxComplexity) {
      throw new Error(
        `Query complexity ${report.complexity} exceeds max allowed ${maxComplexity}. Trim fields to reduce payload.`,
      );
    }

    const startedAt = performance.now();
    const payload = options.usePersistedQuery
      ? await buildPersistedQueryPayload(query, queryConfig.variables, false)
      : buildStandardPayload(query, queryConfig.variables);
    const requestBody = JSON.stringify(payload);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
      signal: options.signal,
    });

    const rawBody = await response.text();
    const responseBytes = byteLength(rawBody);
    const durationMs = Math.round(performance.now() - startedAt);
    this.emitMonitoring(options, {
      operationName: queryConfig.operationName,
      complexity: report.complexity,
      requestBytes: byteLength(requestBody),
      responseBytes,
      durationMs,
      persistedQuery: Boolean(options.usePersistedQuery),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed (${response.status}): ${response.statusText}`);
    }

    const parsed = JSON.parse(rawBody) as GraphQLResponse<TData>;
    if (parsed.errors?.length) {
      throw new Error(parsed.errors.map((error) => error.message).join('; '));
    }
    if (!parsed.data) {
      throw new Error('GraphQL response has no data payload.');
    }

    return parsed.data;
  }

  private emitMonitoring(options: GraphQLRequestOptions, report: GraphQLMonitoringReport): void {
    if (options.monitor) {
      options.monitor(report);
      return;
    }

    if (typeof window !== 'undefined') {
      // lightweight default monitoring for local diagnostics
      console.debug('[graphql-monitor]', report);
    }
  }
}

function buildStandardPayload(query: string, variables?: GraphQLVariables): {
  query: string;
  variables?: GraphQLVariables;
} {
  return { query, variables };
}

function byteLength(input: string): number {
  return new TextEncoder().encode(input).length;
}
