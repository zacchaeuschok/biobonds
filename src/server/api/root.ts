import { router } from "./trpc/trpc";
import { bondsRouter } from "./routers/bonds";
import { investmentsRouter } from "./routers/investments";
import { credentialsRouter } from "./routers/credentials";
import { usersRouter } from "./routers/users";
import { xrplRouter } from "./routers/xrpl";

export const appRouter = router({
  bonds: bondsRouter,
  investments: investmentsRouter,
  credentials: credentialsRouter,
  users: usersRouter,
  xrpl: xrplRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
