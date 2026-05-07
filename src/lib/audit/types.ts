export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
}

export interface CreateAuditLogInput {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
}

export interface AuditQuery {
  search?: string;
  action?: AuditAction;
  actorId?: string;
  targetType?: string;
  limit?: number;
  offset?: number;
}
