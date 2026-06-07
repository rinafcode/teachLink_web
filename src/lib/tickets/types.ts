import { z } from 'zod';

export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketCategorySchema = z.enum(['billing', 'technical', 'account', 'content', 'other']);
export type TicketCategory = z.infer<typeof TicketCategorySchema>;

/**
 * Risk level assigned by the risk assessment engine.
 * - low      — routine issue, standard SLA
 * - medium   — elevated impact, expedited handling
 * - high     — significant user/data impact, urgent
 * - critical — potential security/data breach, immediate escalation
 */
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const RiskAssessmentSchema = z.object({
  level: RiskLevelSchema,
  score: z.number().min(0).max(100),
  /** Human-readable factors that contributed to this risk score. */
  factors: z.array(z.string()),
  assessedAt: z.number(),
});
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const TicketSchema = z.object({
  id: z.string(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  status: TicketStatusSchema,
  submittedBy: z.string(),
  assignedTo: z.string().nullable(),
  risk: RiskAssessmentSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketInputSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: TicketCategorySchema,
  priority: TicketPrioritySchema,
  submittedBy: z.string().min(1).max(256),
});
export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;

export const UpdateTicketInputSchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  assignedTo: z.string().nullable().optional(),
});
export type UpdateTicketInput = z.infer<typeof UpdateTicketInputSchema>;
