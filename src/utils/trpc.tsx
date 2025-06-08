import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/api/root';
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import superjson from 'superjson';

/**
 * A set of type-safe react-query hooks for your tRPC API
 */
export const trpc = createTRPCReact<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In the browser, we return a relative URL
    return 'http://localhost:3000';
  }
  // When rendering on the server, we return an absolute URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}`, // Remove the /trpc prefix since the server handles it differently
      // Include credentials to support authentication
      fetch(url, options) {
        console.log('tRPC request:', url);
        return fetch(url, {
          ...options,
          credentials: 'include',
          headers: {
            ...options?.headers,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
      },
    }),
  ],
  transformer: superjson,
});

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>;
