import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Zillion Enterprise",
  description: "Enterprise management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#18181b",
          borderRadius: "0.625rem",
          colorText: "#18181b",
          colorInputBackground: "#ffffff",
          colorInputText: "#18181b",
          fontFamily: '"Geist", system-ui, sans-serif',
        },
        elements: {
          card: "shadow-none border",
          headerTitle: "text-xl font-semibold",
          headerSubtitle: "text-sm text-muted-foreground",
          socialButtonsBlockButton:
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-normal h-10",
          formButtonPrimary:
            "bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md text-sm font-medium shadow-none",
          formFieldInput:
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
