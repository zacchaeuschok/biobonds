import { z } from "zod";
import { router, publicProcedure, protectedProcedure, providerProcedure } from "../trpc/trpc";
import { bondStatusEnum, createBondSchema } from "../schemas";
import { TRPCError } from "@trpc/server";

export const bondsRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.bioBond.findMany({
      include: {
        provider: {
          select: {
            id: true,
            walletAddress: true,
            userType: true,
            verified: true,
          }
        },
        outcomes: true,
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const bond = await ctx.prisma.bioBond.findUnique({
        where: { id: input.id },
        include: {
          provider: {
            select: {
              id: true,
              walletAddress: true,
              userType: true,
              verified: true,
            }
          },
          outcomes: true,
          investments: {
            include: {
              investor: {
                select: {
                  id: true,
                  walletAddress: true,
                  userType: true,
                }
              },
            },
          },
          credentials: {
            include: {
              issuer: {
                select: {
                  id: true,
                  walletAddress: true,
                  userType: true,
                }
              },
              subject: {
                select: {
                  id: true,
                  walletAddress: true,
                  userType: true,
                }
              },
            },
          },
        },
      });

      if (!bond) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bond not found",
        });
      }

      return bond;
    }),

  create: providerProcedure
    .input(createBondSchema)
    .mutation(async ({ ctx, input }) => {
      const { outcomes, ...bondData } = input;
      
      // Convert maturityDate to Date if it's a string
      const maturityDate = typeof bondData.maturityDate === 'string' 
        ? new Date(bondData.maturityDate) 
        : bondData.maturityDate;

      return ctx.prisma.$transaction(async (tx) => {
        // Create the bond
        const bond = await tx.bioBond.create({
          data: {
            ...bondData,
            maturityDate,
            status: "ACTIVE",
            providerId: ctx.session?.user?.id,
            outcomes: {
              createMany: {
                data: outcomes.map((outcome) => ({
                  target: outcome.target,
                  achieved: outcome.achieved || false,
                  verificationDate: outcome.verificationDate,
                })),
              },
            },
          },
        });

        return bond;
      });
    }),

  updateStatus: providerProcedure
    .input(z.object({
      id: z.string(),
      status: bondStatusEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is authorized (provider of the bond)
      const bond = await ctx.prisma.bioBond.findUnique({
        where: { id: input.id },
        select: { providerId: true },
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
          message: "Not authorized to update this bond",
        });
      }

      return ctx.prisma.bioBond.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  updateOutcomes: providerProcedure
    .input(z.object({
      bondId: z.string(),
      outcomes: z.array(z.object({
        id: z.string(),
        achieved: z.boolean(),
        verificationDate: z.date().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is authorized (provider of the bond)
      const bond = await ctx.prisma.bioBond.findUnique({
        where: { id: input.bondId },
        select: { providerId: true },
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
          message: "Not authorized to update this bond",
        });
      }

      // Update each outcome
      const updatePromises = input.outcomes.map(outcome => 
        ctx.prisma.outcome.update({
          where: { id: outcome.id },
          data: { 
            achieved: outcome.achieved,
            verificationDate: outcome.verificationDate || new Date(),
          },
        })
      );

      await Promise.all(updatePromises);

      return ctx.prisma.bioBond.findUnique({
        where: { id: input.bondId },
        include: { outcomes: true },
      });
    }),
});
