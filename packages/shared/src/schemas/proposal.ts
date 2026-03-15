import { z } from 'zod';

export const proposalCardSchema = z.object({
  cardId: z.string(),
  cardName: z.string(),
  imageUrl: z.string(),
  rarity: z.string(),
});

export const proposalStatusValues = [
  'pending',
  'accepted',
  'rejected',
  'countered',
  'completed',
  'cancelled',
] as const;

export const proposalStatusSchema = z.enum(proposalStatusValues);

export const createProposalSchema = z.object({
  matchId: z.string().optional(),
  postId: z.string().optional(),
  receiverId: z.string(),
  senderGives: z.array(proposalCardSchema).min(1),
  senderGets: z.array(proposalCardSchema).min(1),
  fairnessScore: z.number(),
  parentId: z.string().optional(),
}).refine(
  (data) => data.matchId || data.postId,
  { message: 'Either matchId or postId must be provided' },
);

export const tradeProposalSchema = z.object({
  id: z.string(),
  matchId: z.string().nullable(),
  postId: z.string().nullable().optional(),
  senderId: z.string(),
  receiverId: z.string(),
  parentId: z.string().nullable(),
  status: proposalStatusSchema,
  senderGives: z.array(proposalCardSchema),
  senderGets: z.array(proposalCardSchema),
  fairnessScore: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProposalCard = z.infer<typeof proposalCardSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type TradeProposal = z.infer<typeof tradeProposalSchema>;
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;
