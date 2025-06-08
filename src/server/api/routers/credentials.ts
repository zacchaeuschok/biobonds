import { z } from "zod";
import { router, protectedProcedure, providerProcedure } from "../trpc/trpc";
import { createCredentialSchema, verifyCredentialSchema } from "../schemas";
import { TRPCError } from "@trpc/server";
import { didService } from "../../services/did.service";
import { xrplService } from "../../services/xrpl.service";

export const credentialsRouter = router({
  getByBond: protectedProcedure
    .input(z.object({ bondId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get the bond to check authorization
      const bond = await ctx.prisma.bioBond.findUnique({
        where: { id: input.bondId },
        select: { 
          providerId: true,
          investments: {
            where: { investorId: ctx.session?.user?.id },
            select: { id: true }
          }
        }
      });

      if (!bond) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bond not found",
        });
      }

      // Check if user is authorized (provider or investor in this bond)
      const isProvider = bond.providerId === ctx.session?.user?.id;
      const isInvestor = bond.investments.length > 0;

      if (!isProvider && !isInvestor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view these credentials",
        });
      }

      return ctx.prisma.credential.findMany({
        where: { bondId: input.bondId },
        include: {
          issuer: {
            select: {
              id: true,
              walletAddress: true,
              userType: true,
              verified: true,
            }
          },
          subject: {
            select: {
              id: true,
              walletAddress: true,
              userType: true,
            }
          }
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const credential = await ctx.prisma.credential.findUnique({
        where: { id: input.id },
        include: {
          bond: {
            select: {
              id: true,
              title: true,
              providerId: true,
              investments: {
                where: { investorId: ctx.session?.user?.id },
                select: { id: true }
              }
            }
          },
          issuer: {
            select: {
              id: true,
              walletAddress: true,
              userType: true,
              verified: true,
            }
          },
          subject: {
            select: {
              id: true,
              walletAddress: true,
              userType: true,
            }
          }
        },
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      // Check if user is authorized (issuer, subject, bond provider, or investor in this bond)
      const isIssuer = credential.issuerId === ctx.session?.user?.id;
      const isSubject = credential.subjectId === ctx.session?.user?.id;
      const isProvider = credential.bond.providerId === ctx.session?.user?.id;
      const isInvestor = credential.bond.investments.length > 0;

      if (!isIssuer && !isSubject && !isProvider && !isInvestor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this credential",
        });
      }

      return credential;
    }),

  create: providerProcedure
    .input(createCredentialSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if bond exists and user is the provider
      const bond = await ctx.prisma.bioBond.findUnique({
        where: { id: input.bondId },
      });

      if (!bond) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bond not found",
        });
      }

      if (bond.providerId !== ctx.session?.user?.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the bond provider can issue credentials",
        });
      }

      // Extract wallet address from subject DID
      const subjectWalletAddress = didService.extractWalletAddress(input.subjectDid);

      // Find or create subject user by wallet address
      let subject = await ctx.prisma.user.findFirst({
        where: { walletAddress: subjectWalletAddress },
      });

      if (!subject) {
        subject = await ctx.prisma.user.create({
          data: {
            walletAddress: subjectWalletAddress,
            userType: "PATIENT",
          },
        });
      }

      // Create issuer DID from the provider's wallet address
      const issuerDid = didService.createDid(ctx.session?.user?.walletAddress);

      // Convert expiresAt to Date if it's a string
      const expiresAt = input.expiresAt 
        ? typeof input.expiresAt === 'string' 
          ? new Date(input.expiresAt) 
          : input.expiresAt
        : undefined;

      // Create verifiable credential
      const verifiableCredential = didService.createVerifiableCredential({
        issuerDid,
        subjectDid: input.subjectDid,
        credentialType: input.credentialType,
        outcomeData: input.outcomeData,
        expirationDate: expiresAt,
      });

      // Create credential in database
      return ctx.prisma.credential.create({
        data: {
          bondId: input.bondId,
          issuerId: ctx.session?.user?.id,
          subjectId: subject.id,
          issuerDid,
          subjectDid: input.subjectDid,
          credentialType: input.credentialType,
          issuedAt: new Date(),
          expiresAt,
          verified: false, // Will be verified on-chain later
          outcomeData: input.outcomeData,
          credentialData: verifiableCredential, // Store the full verifiable credential
        },
      });
    }),

  verify: protectedProcedure
    .input(verifyCredentialSchema)
    .mutation(async ({ ctx, input }) => {
      const credential = await ctx.prisma.credential.findUnique({
        where: { id: input.credentialId },
        include: {
          bond: true,
          issuer: true,
          subject: true,
        },
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      // Check if user is authorized (issuer or bond provider)
      const isIssuer = credential.issuerId === ctx.session?.user?.id;
      const isProvider = credential.bond.providerId === ctx.session?.user?.id;

      if (!isIssuer && !isProvider) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the issuer or bond provider can verify credentials",
        });
      }

      // Verify credential on XRPL
      const verificationResult = await xrplService.verifyCredential({
        issuerDid: credential.issuerDid,
        subjectDid: credential.subjectDid,
        credentialData: credential.credentialData,
      });

      if (!verificationResult.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Credential verification failed",
        });
      }

      // Update credential in database
      return ctx.prisma.credential.update({
        where: { id: input.credentialId },
        data: {
          verified: true,
          verifiedAt: new Date(),
          verificationTxHash: verificationResult.txHash,
        },
      });
    }),

  publishToXrpl: providerProcedure
    .input(z.object({
      credentialId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const credential = await ctx.prisma.credential.findUnique({
        where: { id: input.credentialId },
        include: {
          bond: true,
          issuer: true,
          subject: true,
        },
      });

      if (!credential) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      // Check if user is authorized (issuer or bond provider)
      const isIssuer = credential.issuerId === ctx.session?.user?.id;
      const isProvider = credential.bond.providerId === ctx.session?.user?.id;

      if (!isIssuer && !isProvider) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the issuer or bond provider can publish credentials",
        });
      }

      // Publish credential to XRPL
      const publishResult = await xrplService.publishCredential({
        issuerWalletAddress: credential.issuer.walletAddress,
        subjectWalletAddress: credential.subject.walletAddress,
        credentialData: credential.credentialData,
      });

      if (!publishResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to publish credential to XRPL",
        });
      }

      // Update credential in database
      return ctx.prisma.credential.update({
        where: { id: input.credentialId },
        data: {
          publishedToXrpl: true,
          publishedAt: new Date(),
          publishTxHash: publishResult.txHash,
        },
      });
    }),
});
