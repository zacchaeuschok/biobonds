import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "../root";
import { createTRPCContext } from "./trpc";

// Export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(`❌ tRPC error on ${path ?? "<no-path>"}: ${error.message}`);
        }
      : undefined,
});
