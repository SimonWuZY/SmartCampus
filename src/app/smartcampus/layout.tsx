import type { Metadata } from "next";
import { Inter } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-tiptap/styles.css";
import { LoadingProvider } from "@/components/loading";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SmartCampus",
  description: "including article note & integrated llms & real-time collaborative documents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={inter.className}
      >
        <LoadingProvider>
          <NuqsAdapter>
            <ConvexClientProvider>
              <Toaster />
              {children}
            </ConvexClientProvider>
          </NuqsAdapter>
        </LoadingProvider>
      </body>
    </html>
  );
}
