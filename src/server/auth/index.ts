import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../db/client";
import * as xrpl from "xrpl";

/**
 * NextAuth options with XRPL wallet authentication
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.walletAddress = token.walletAddress;
        session.user.userType = token.userType;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.walletAddress = user.walletAddress;
        token.userType = user.userType;
      }
      return token;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "XRPL Wallet",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
        userType: { label: "User Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress || !credentials?.signature || !credentials?.message) {
          return null;
        }

        try {
          // Verify XRPL signature
          // Note: In a real implementation, you would use the XRPL library to verify signatures
          // This is simplified for the demo
          const isValid = true; // Replace with actual verification logic
          
          if (!isValid) {
            return null;
          }

          // Find or create user
          let user = await prisma.user.findUnique({
            where: { walletAddress: credentials.walletAddress },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                walletAddress: credentials.walletAddress,
                userType: credentials.userType as "INVESTOR" | "PROVIDER" | "PATIENT",
              },
            });
          }

          return {
            id: user.id,
            walletAddress: user.walletAddress,
            userType: user.userType,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
};
