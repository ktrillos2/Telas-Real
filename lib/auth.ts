import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "WordPress",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }
                try {
                    // Authenticate against "JWT Authentication for WP REST API" plugin
                    // Endpoint: /wp-json/jwt-auth/v1/token
                    const res = await fetch(`${process.env.WORDPRESS_API_URL}/wp-json/jwt-auth/v1/token`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username: credentials.username,
                            password: credentials.password,
                        }),
                    });

                    const data = await res.json();

                    if (res.ok && data.token) {
                        return {
                            id: data.user_id || "1",
                            name: data.user_display_name,
                            email: data.user_email,
                            image: null,
                            accessToken: data.token,
                        };
                    } else {
                        console.error("Login failed:", data);
                        return null;
                    }
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                (session as any).accessToken = token.accessToken;
                (session as any).user.id = token.id;
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
