/**
 * NextAuth.js configuration
 * CredentialsProvider with JWT session strategy
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      accountId: string;
      role: string;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    accountId: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    accountId: string;
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Lazy imports to avoid build-time errors
        const { getPrisma } = await import("@/lib/db");
        const bcrypt = await import("bcryptjs");

        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            firstName: true,
            passwordHash: true,
            accountId: true,
            role: true,
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          accountId: user.accountId,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.accountId = user.accountId;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.userId,
        accountId: token.accountId,
        role: token.role,
      };
      return session;
    },
  },

  pages: {
    signIn: "/ko/login",
    error: "/ko/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
