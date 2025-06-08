import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { xrplService } from "../../services/xrpl.service";

export const xrplRouter = router({
  getAccountInfo: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ input }) => {
      try {
        return await xrplService.getAccountInfo(input.address);
      } catch (error) {
        console.error("XRPL error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get account info from XRPL",
        });
      }
    }),

  createTestWallet: publicProcedure.mutation(async () => {
    try {
      return await xrplService.createTestWallet();
    } catch (error) {
      console.error("XRPL error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create test wallet",
      });
    }
  }),

  createEscrow: protectedProcedure
    .input(z.object({
      fromAddress: z.string(),
      toAddress: z.string(),
      amount: z.number().positive(),
      finishAfterMinutes: z.number().int().positive(),
      cancelAfterDays: z.number().int().positive(),
      seed: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await xrplService.createEscrow({
          fromAddress: input.fromAddress,
          toAddress: input.toAddress,
          amount: input.amount,
          finishAfterMinutes: input.finishAfterMinutes,
          cancelAfterDays: input.cancelAfterDays,
          seed: input.seed,
        });
      } catch (error) {
        console.error("XRPL error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create escrow transaction",
        });
      }
    }),

  finishEscrow: protectedProcedure
    .input(z.object({
      walletAddress: z.string(),
      escrowCreator: z.string(),
      escrowSequence: z.number().int().positive(),
      seed: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await xrplService.finishEscrow({
          walletAddress: input.walletAddress,
          escrowCreator: input.escrowCreator,
          escrowSequence: input.escrowSequence,
          seed: input.seed,
        });
      } catch (error) {
        console.error("XRPL error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to finish escrow transaction",
        });
      }
    }),

  createHealthCredential: protectedProcedure
    .input(z.object({
      issuerAddress: z.string(),
      subjectAddress: z.string(),
      credentialType: z.string(),
      outcomeData: z.record(z.string(), z.any()),
      expirationDays: z.number().int().optional(),
      seed: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        return await xrplService.createHealthCredential({
          issuerAddress: input.issuerAddress,
          subjectAddress: input.subjectAddress,
          credentialType: input.credentialType,
          outcomeData: input.outcomeData,
          expirationDays: input.expirationDays,
          seed: input.seed,
        });
      } catch (error) {
        console.error("XRPL error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create health credential",
        });
      }
    }),

  verifyCredential: protectedProcedure
    .input(z.object({
      issuerAddress: z.string(),
      subjectAddress: z.string(),
      credentialType: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const transformedInput = {
          issuerDid: `did:xrpl:${input.issuerAddress}`,
          subjectDid: `did:xrpl:${input.subjectAddress}`,
          credentialData: {
            type: input.credentialType,
            issuer: `did:xrpl:${input.issuerAddress}`,
            subject: `did:xrpl:${input.subjectAddress}`
          }
        };
        
        return await xrplService.verifyCredential(transformedInput);
      } catch (error) {
        console.error("XRPL error:", error);
        
        // Check if error is "entryNotFound"
        if (error.data?.error === "entryNotFound") {
          return {
            isValid: false,
            error: "Credential not found on XRPL",
          };
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify credential",
        });
      }
    }),
});
