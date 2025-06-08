import { z } from "zod";
import { router, protectedProcedure } from "../trpc/trpc";
import { createInvestmentSchema, investmentStatusEnum } from "../schemas";
import { TRPCError } from "@trpc/server";

export const investmentsRouter = router({
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.investment.findMany({
      where: { investorId: ctx.session.user.id },
      include: {
        bond: {
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
          }
        }
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const investment = await ctx.prisma.investment.findUnique({
        where: { id: input.id },
        include: {
          bond: {
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
            }
          },
          investor: {
            select: {
              id: true,
              walletAddress: true,
              userType: true,
            }
          }
        },
      });

      if (!investment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment not found",
        });
      }

      // Check if user is authorized to view this investment
      if (investment.investorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view this investment",
        });
      }

      return investment;
    }),

  create: protectedProcedure
    .input(createInvestmentSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if bond exists
      const bond = await ctx.prisma.bioBond.findUnique({
        where: { id: input.bondId },
      });

      if (!bond) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bond not found",
        });
      }

      // Check if bond is still active
      if (bond.status !== "ACTIVE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bond is not active for investment",
        });
      }

      // Create investment and update bond's current amount
      return ctx.prisma.$transaction(async (tx) => {
        const investment = await tx.investment.create({
          data: {
            bondId: input.bondId,
            investorId: ctx.session.user.id,
            amount: input.amount,
            investmentDate: new Date(),
            status: "ACTIVE",
            escrowTxHash: input.escrowTxHash,
          },
        });

        // Update bond's current amount
        await tx.bioBond.update({
          where: { id: input.bondId },
          data: { 
            currentAmount: { increment: input.amount },
            // If the bond is now fully funded, update status
            status: bond.currentAmount + input.amount >= bond.targetAmount ? "FUNDED" : bond.status,
          },
        });

        // Update user's totalInvested
        await tx.user.update({
          where: { id: ctx.session.user.id },
          data: {
            totalInvested: {
              increment: input.amount
            },
            activeBonds: {
              increment: 1
            }
          }
        });

        return investment;
      });
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: investmentStatusEnum,
      yieldEarned: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const investment = await ctx.prisma.investment.findUnique({
        where: { id: input.id },
        include: { bond: true },
      });

      if (!investment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investment not found",
        });
      }

      // Check if user is authorized (investor or bond provider)
      if (investment.investorId !== ctx.session.user.id && 
          investment.bond.providerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this investment",
        });
      }

      // Update investment status
      return ctx.prisma.$transaction(async (tx) => {
        const updatedInvestment = await tx.investment.update({
          where: { id: input.id },
          data: { 
            status: input.status,
            yieldEarned: input.yieldEarned || investment.yieldEarned,
          },
        });

        // If investment is settled, update user's yield earned
        if (input.status === "SETTLED" && input.yieldEarned) {
          await tx.user.update({
            where: { id: investment.investorId },
            data: {
              totalYieldEarned: {
                increment: input.yieldEarned
              },
              activeBonds: {
                decrement: 1
              }
            }
          });
        }

        return updatedInvestment;
      });
    }),
});
