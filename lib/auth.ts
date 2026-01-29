import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import bcrypt from "bcrypt";

const serverClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_TOKEN, // Needed to read sensitive data if protected, or just good practice
});

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Fetch user by email
                    // Projection to get password hash
                    const user = await serverClient.fetch(
                        `*[_type == "user" && email == $email][0]{
                            _id,
                            name,
                            email,
                            password,
                            role,
                            image
                        }`,
                        { email: credentials.email }
                    );

                    if (!user || !user.password) {
                        return null;
                    }

                    // Verify password
                    const isValid = await bcrypt.compare(credentials.password, user.password);

                    if (!isValid) {
                        return null;
                    }

                    return {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        image: user.image?.asset?._ref || null, // Or resolve url
                        role: user.role, // Custom property
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                // (session as any).user.id = token.id;
                // (session as any).user.role = token.role;
                session.user = {
                    ...session.user,
                    id: token.id as string,
                    role: token.role as string,
                } as any;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
