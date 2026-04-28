export type GraphQLScalar = string | number | boolean | null;

export type GraphQLVariables = Record<string, unknown>;

export type GraphQLFieldSelection =
  | true
  | {
      args?: Record<string, GraphQLScalar>;
      fields?: GraphQLSelectionSet;
    };

export type GraphQLSelectionSet = Record<string, GraphQLFieldSelection>;

export interface GraphQLQueryConfig {
  operationName: string;
  rootField: string;
  variables?: GraphQLVariables;
  variableTypes?: Record<string, string>;
  selection: GraphQLSelectionSet;
}

export interface QueryComplexityReport {
  complexity: number;
  depth: number;
  fields: number;
  aliases: number;
  fragments: number;
}

export interface GraphQLMonitoringReport {
  operationName: string;
  complexity: number;
  requestBytes: number;
  responseBytes: number;
  durationMs: number;
  persistedQuery: boolean;
}

export interface GraphQLRequestOptions {
  usePersistedQuery?: boolean;
  maxComplexity?: number;
  monitor?: (report: GraphQLMonitoringReport) => void;
  signal?: AbortSignal;
}
