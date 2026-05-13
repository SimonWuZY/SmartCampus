"use client";

import { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, SignIn } from "@clerk/nextjs"
import { ConvexReactClient, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { FullscreenLoader } from "./fullscreen-loader";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
            signInFallbackRedirectUrl="/smartcampus/chat"
            signUpFallbackRedirectUrl="/smartcampus/chat"
        >
            <ConvexProviderWithClerk
                useAuth={useAuth}
                client={convex}
            >
                <Authenticated>
                    {children}
                </Authenticated>
                <Unauthenticated>
                    <div className="flex flex-col items-center justify-center min-h-screen">
                        <SignIn
                            routing="hash"
                            fallbackRedirectUrl="/smartcampus/chat"
                            signUpFallbackRedirectUrl="/smartcampus/chat"
                        />
                    </div>
                </Unauthenticated>
                <AuthLoading>
                    <FullscreenLoader label="正在拼命加载中" />
                </AuthLoading>
            </ConvexProviderWithClerk>
        </ClerkProvider>
    )
}