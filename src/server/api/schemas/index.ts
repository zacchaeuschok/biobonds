import { z } from "zod";

// User schemas
export const userTypeEnum = z.enum(["INVESTOR", "PROVIDER", "PATIENT"]);

export const createUserSchema = z.object({
  walletAddress: z.string().min(1),
  userType: userTypeEnum,
});

// BioBond schemas
export const bondStatusEnum = z.enum(["ACTIVE", "FUNDED", "COMPLETED", "EXPIRED"]);

export const outcomeSchema = z.object({
  target: z.string().min(1),
  achieved: z.boolean().optional().default(false),
  verificationDate: z.date().optional(),
});

export const createBondSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  healthOutcome: z.string().min(1),
  targetAmount: z.number().positive(),
  yieldRate: z.number().min(0),
  maturityDate: z.string().or(z.date()),
  outcomes: z.array(outcomeSchema),
});

// Investment schemas
export const investmentStatusEnum = z.enum(["ACTIVE", "SETTLED", "CANCELLED"]);

export const createInvestmentSchema = z.object({
  bondId: z.string().min(1),
  amount: z.number().positive(),
  escrowTxHash: z.string().optional(),
});

// Credential schemas
export const outcomeDataSchema = z.object({
  type: z.string(),
  value: z.number(),
  unit: z.string(),
}).or(z.record(z.string(), z.any()));

export const createCredentialSchema = z.object({
  bondId: z.string().min(1),
  subjectDid: z.string().min(1),
  credentialType: z.string().min(1),
  outcomeData: outcomeDataSchema,
  expiresAt: z.string().or(z.date()).optional(),
});

export const verifyCredentialSchema = z.object({
  credentialId: z.string().min(1),
});
