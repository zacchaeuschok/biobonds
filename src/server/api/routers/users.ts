import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc/trpc";
import { createUserSchema } from "../schemas";
import { TRPCError } from "@trpc/server";

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        investments: {
          select: {
            id: true,
            amount: true,
            status: true,
            yieldEarned: true,
          }
        },
        bonds: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  getByWalletAddress: publicProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { walletAddress: input.walletAddress },
        select: {
          id: true,
          walletAddress: true,
          userType: true,
          verified: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),

  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { walletAddress: input.walletAddress },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this wallet address already exists",
        });
      }

      return ctx.prisma.user.create({
        data: {
          walletAddress: input.walletAddress,
          userType: input.userType,
        },
      });
    }),

  updateUserType: protectedProcedure
    .input(z.object({
      userType: z.enum(["INVESTOR", "PROVIDER", "PATIENT"]),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { userType: input.userType },
      });
    }),
});
