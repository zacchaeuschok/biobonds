import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import { getServerSession } from 'next-auth';
import { prisma } from '../../db/client';
import type { Session } from 'next-auth';

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request
 */
interface CreateContextOptions {
  session: Session | null;
}

/**
 * Creates context for the tRPC API
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * Creates context for the standalone tRPC server
 */
export const createContext = async (opts: CreateHTTPContextOptions) => {
  // For standalone server, we need to handle sessions differently
  // This is a simplified version - you may need to implement proper session handling
  // based on cookies or authorization headers
  const session = null; // Replace with actual session retrieval logic
  
  return createInnerTRPCContext({
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and
 * transformer.
 */
const t = initTRPC.context<typeof createContext>().create();

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the router definition.
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees `ctx.session.user` is
 * not null.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Provider-only procedure
 */
export const providerProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  // Check if user is a provider
  const user = await prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { userType: true },
  });
  
  if (!user || user.userType !== 'PROVIDER') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  
  return next({
    ctx: {
      ...ctx,
      // infers that `session` is non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
